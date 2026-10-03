import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

export const resetEmployeePasswordByAdmin = functions.https.onCall({ invoker: 'public' }, async (request) => {
  const { requestId, actorId, actorName } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }

  const db = admin.firestore();

  // 1. Resolve caller
  const callerSnap = await db.collection('employees').where('employeeId', '==', uid).limit(1).get();
  if (callerSnap.empty) {
    throw new functions.https.HttpsError('permission-denied', 'Caller not found.');
  }

  const callerDoc = callerSnap.docs[0];
  const callerData = callerDoc.data();

  // 2. Authorize
  if (callerData.assignedRole !== 'Super Admin' && callerData.role !== 'Super Admin') {
    throw new functions.https.HttpsError('permission-denied', 'Super Admin role required.');
  }

  // 3. Get the request document
  const requestRef = db.collection('admin_password_reset_requests').doc(requestId);
  const requestSnap = await requestRef.get();
  if (!requestSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Request not found.');
  }

  const requestData = requestSnap.data();
  if (requestData?.status !== 'Pending') {
    throw new functions.https.HttpsError('failed-precondition', 'Request is not pending.');
  }

  const employeeId = requestData?.employeeId;
  if (!employeeId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing employeeId in request.');
  }

  // 4. Resolve target employee
  const targetSnap = await db.collection('employees').where('employeeId', '==', employeeId).limit(1).get();
  if (targetSnap.empty) {
    throw new functions.https.HttpsError('not-found', 'Target employee not found.');
  }

  const targetDoc = targetSnap.docs[0];
  const targetData = targetDoc.data();

  // 5. Default Password config
  const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'HireHuub@2026';
  const emailAuth = `${employeeId.toLowerCase()}@hirehuub.local`;

  try {
    // 6. Find Auth user & reset password
    let authUser;
    try {
      authUser = await admin.auth().getUserByEmail(emailAuth);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError('not-found', 'Firebase auth user not found for this employee.');
      }
      throw e;
    }

    await admin.auth().updateUser(authUser.uid, { password: DEFAULT_PASSWORD });

    // 7. Update Employee profile (require password change, clear locks)
    const updateData: any = {
      firstLoginCompleted: false, // Forces password change on login
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (targetData.accountStatus === 'Locked' && targetData.lockReason === 'Too many failed login attempts') {
      updateData.failedLoginAttempts = 0;
      updateData.lockedUntil = null;
      updateData.lockReason = null;
      updateData.accountStatus = 'Active';
    }

    await targetDoc.ref.update(updateData);

    // 8. Update request status
    await requestRef.update({
      status: 'Completed',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: actorId || callerData.employeeId,
      processedByName: actorName || callerData.name || callerData.fullName,
      resolvedBy: actorName || callerData.name || callerData.fullName // keep legacy field just in case
    });

    // 9. Audit Log
    await db.collection('admin_audit_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      whoId: actorId || callerData.employeeId,
      whoName: actorName || callerData.name || callerData.fullName,
      whatAction: 'ADMIN_PASSWORD_RESET',
      entityName: 'Employee',
      entityId: employeeId,
      oldValue: 'Password Reset Requested',
      newValue: 'Default Password Set'
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error in resetEmployeePasswordByAdmin:', err);
    throw new functions.https.HttpsError('internal', err.message);
  }
});
