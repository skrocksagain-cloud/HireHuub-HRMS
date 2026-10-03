import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const unlockEmployeeAccount = onCall({ cors: true, invoker: 'public' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to perform this action.');
  }

  const { employeeId } = request.data;
  if (!employeeId || typeof employeeId !== 'string') {
    throw new HttpsError('invalid-argument', 'Missing or invalid employeeId parameter.');
  }

  const cleanId = employeeId.trim();
  const db = admin.firestore();

  try {
    // 1. Resolve Actor Profile
    const actorSnap = await db.collection('employees').where('firebaseUid', '==', request.auth.uid).limit(1).get();
    if (actorSnap.empty) {
      throw new HttpsError('permission-denied', 'Actor employee profile not found.');
    }
    const actorData = actorSnap.docs[0].data();
    if (actorData.assignedRole !== 'Super Admin') {
      throw new HttpsError('permission-denied', 'Only Super Admin can unlock accounts.');
    }
    const actorEmployeeId = actorData.employeeId;

    // 2. Resolve Target Employee
    let employeeDocId = cleanId;
    let employeeData: any = null;

    const docRef = db.collection('employees').doc(cleanId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists && docSnap.data()?.employeeId === cleanId) {
      employeeData = docSnap.data();
    } else {
      const snapshot = await db.collection('employees').where('employeeId', '==', cleanId).limit(1).get();
      if (!snapshot.empty) {
        employeeDocId = snapshot.docs[0].id;
        employeeData = snapshot.docs[0].data();
      }
    }

    if (!employeeData) {
      throw new HttpsError('not-found', 'Employee record not found.');
    }

    if (employeeData.accountStatus !== 'Locked') {
      throw new HttpsError('failed-precondition', 'Employee account is not currently locked.');
    }

    // 3. Clear Lock State (No Firebase Auth disabled state modifications here)
    await db.collection('employees').doc(employeeDocId).update({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lockReason: null,
      accountStatus: 'Active',
      updatedAt: new Date().toISOString()
    });

    // 4. Audit Logging
    await db.collection('admin_audit_logs').add({
      whoId: actorEmployeeId,
      whoName: actorData.name || actorData.fullName || 'Unknown',
      whatAction: 'ACCOUNT_UNLOCK',
      entityName: 'Employee',
      entityId: employeeData.employeeId,
      oldValue: 'Locked',
      newValue: 'Active',
      timestamp: new Date().toISOString()
    });

    return { success: true, message: 'Account unlocked successfully.' };
  } catch (err: any) {
    console.error('Error unlocking account:', err);
    if (err instanceof HttpsError) {
      throw err;
    }
    throw new HttpsError('internal', 'An internal error occurred while unlocking the account.');
  }
});
