import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const resetHH0005 = functions.https.onRequest(async (req, res) => {
  try {
    const canonicalEmail = 'hh0005@hirehuub.local';
    const oldUid = 'a6g8XUrtqhafS4RTK9EPHD2ku5A2';
    
    // Delete existing
    try {
      await admin.auth().deleteUser(oldUid);
      console.log('Deleted user by old UID.');
    } catch (e: any) {
      console.log('Old UID delete error:', e.message);
    }
    
    try {
      const existing = await admin.auth().getUserByEmail(canonicalEmail);
      await admin.auth().deleteUser(existing.uid);
      console.log('Deleted user by canonical email.');
    } catch (e: any) {
      console.log('Canonical email delete error:', e.message);
    }
    
    // Create new
    const newUser = await admin.auth().createUser({
      email: canonicalEmail,
      password: 'Password@123',
    });
    
    const newUid = newUser.uid;
    console.log('Created new user with UID:', newUid);
    
    // Update Firestore
    const db = admin.firestore();
    await db.collection('employees').doc('HH0005').update({
      firebaseUid: newUid,
      firstLoginCompleted: false,
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lockReason: null,
      tempPasswordHash: null
    });
    console.log('Updated Firestore for HH0005.');
    
    res.json({ success: true, newUid });
  } catch (err: any) {
    console.error('Error in resetHH0005:', err);
    res.status(500).json({ error: err.message });
  }
});
