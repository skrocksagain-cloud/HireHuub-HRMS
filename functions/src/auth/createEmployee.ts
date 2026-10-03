import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const createEmployee = onCall({ cors: true, invoker: 'public' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to perform this action.');
  }

  const { employeeRecord } = request.data;
  if (!employeeRecord || !employeeRecord.employeeId) {
    throw new HttpsError('invalid-argument', 'Missing employee record data.');
  }

  const db = admin.firestore();
  
  // 1. Authorize Caller
  const actorSnap = await db.collection('employees').where('firebaseUid', '==', request.auth.uid).limit(1).get();
  if (actorSnap.empty) {
    throw new HttpsError('permission-denied', 'Actor employee profile not found.');
  }
  const actorData = actorSnap.docs[0].data();
  const actorRole = (actorData.assignedRole || '').toLowerCase();
  const actorDept = (actorData.department || '').toLowerCase();

  const isAllowed = 
    actorRole === 'super admin' || 
    actorRole === 'master admin' || 
    actorRole === 'admin' || 
    actorDept === 'hr' || 
    actorDept === 'management';

  if (!isAllowed) {
    throw new HttpsError('permission-denied', 'You do not have permission to create employees.');
  }

  const { employeeId, employeeCode, firstName, lastName } = employeeRecord;
  const canonicalEmail = `${employeeId.toLowerCase()}@hirehuub.local`;

  // 2. Check Uniqueness in Firestore & Idempotency
  const duplicateSnap = await db.collection('employees')
    .where('employeeId', '==', employeeId)
    .limit(1)
    .get();
    
  if (!duplicateSnap.empty) {
    const existingDoc = duplicateSnap.docs[0];
    const existingData = existingDoc.data();
    
    // Check if canonical email already exists in Auth
    try {
      const existingAuth = await admin.auth().getUserByEmail(canonicalEmail);
      if (existingData.firebaseUid === existingAuth.uid) {
        // Case A: Safely idempotent
        return { id: existingDoc.id, success: true, idempotent: true };
      } else {
        throw new HttpsError('already-exists', `Provisioning conflict: Employee record exists but is not linked to the existing Auth identity ${canonicalEmail}.`);
      }
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        throw new HttpsError('already-exists', `Provisioning conflict: Employee record exists but has no corresponding Auth identity.`);
      }
      if (e instanceof HttpsError) throw e;
      throw new HttpsError('internal', `Error checking existing Auth: ${e.message}`);
    }
  }

  const duplicateCodeSnap = await db.collection('employees')
    .where('employeeCode', '==', employeeCode)
    .limit(1)
    .get();
    
  if (!duplicateCodeSnap.empty) {
    throw new HttpsError('already-exists', `Employee Code ${employeeCode} already exists.`);
  }

  // 3. Handle Firebase Auth identity
  let firebaseUid: string;
  let authCreatedByUs = false;

  try {
    const existingAuth = await admin.auth().getUserByEmail(canonicalEmail);
    
    // Case B & C: Auth identity exists, but Employee document doesn't
    const uidCheckSnap = await db.collection('employees').where('firebaseUid', '==', existingAuth.uid).limit(1).get();
    if (!uidCheckSnap.empty) {
      const owner = uidCheckSnap.docs[0].data();
      throw new HttpsError('already-exists', `Auth identity conflict: email ${canonicalEmail} is already linked to Employee ID ${owner.employeeId}.`);
    } else {
      throw new HttpsError('already-exists', `Auth identity conflict: The email ${canonicalEmail} exists as an orphaned Auth account. Please contact an Administrator to resolve this.`);
    }
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      // Create new Auth User
      try {
        const newUser = await admin.auth().createUser({
          email: canonicalEmail,
          password: 'Password@123',
          displayName: `${firstName} ${lastName}`.trim(),
          disabled: false
        });
        firebaseUid = newUser.uid;
        authCreatedByUs = true;
      } catch (createErr: any) {
        throw new HttpsError('internal', `Failed to create Auth account: ${createErr.message}`);
      }
    } else {
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', `Error checking Auth account: ${err.message}`);
    }
  }

  // 4. Create Firestore Document
  let docId: string;
  try {
    const finalRecord = {
      ...employeeRecord,
      firebaseUid,
      firstLoginCompleted: false,
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lockReason: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // ensure we don't save any passwords
    delete finalRecord.password;

    docId = await db.runTransaction(async (t) => {
      // Re-check employeeId and employeeCode inside the transaction to prevent concurrent race conditions
      const empIdQuery = await t.get(db.collection('employees').where('employeeId', '==', employeeId).limit(1));
      if (!empIdQuery.empty) {
         throw new Error('employeeId_exists');
      }
      const empCodeQuery = await t.get(db.collection('employees').where('employeeCode', '==', employeeCode).limit(1));
      if (!empCodeQuery.empty) {
         throw new Error('employeeCode_exists');
      }
      
      const newDocRef = db.collection('employees').doc();
      t.set(newDocRef, finalRecord);
      return newDocRef.id;
    });
  } catch (dbErr: any) {
    // 5. Rollback Auth User if Firestore fails
    if (authCreatedByUs) {
      try {
        await admin.auth().deleteUser(firebaseUid);
      } catch (rollbackErr) {
        console.error(`Rollback failed for Auth user ${firebaseUid}`);
      }
    }
    if (dbErr.message === 'employeeId_exists') {
      throw new HttpsError('already-exists', `Employee ID ${employeeId} already exists.`);
    }
    if (dbErr.message === 'employeeCode_exists') {
      throw new HttpsError('already-exists', `Employee Code ${employeeCode} already exists.`);
    }
    throw new HttpsError('internal', `Failed to create employee record: ${dbErr.message}`);
  }

  return { id: docId, success: true };
});
