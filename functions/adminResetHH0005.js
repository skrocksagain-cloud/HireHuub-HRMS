const admin = require('firebase-admin');

admin.initializeApp({
  projectId: "hirehuub-hrms-86942"
});

const db = admin.firestore();

async function resetHH0005() {
  const email = "hh0005@hirehuub.local";
  const newPassword = "[MY NEW PASSWORD]";

  try {
    // 1. Get user
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`Found user! UID: ${userRecord.uid}, Email: ${userRecord.email}`);

    // 2. Update password
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword
    });
    console.log(`Successfully updated password for Firebase Auth UID: ${userRecord.uid}`);

    // 3. Unlock Firestore record
    const empRef = db.collection('employees').doc('HH0005');
    const empSnap = await empRef.get();
    if (!empSnap.exists) {
      console.error("Firestore document employees/HH0005 does not exist!");
      return;
    }

    await empRef.update({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lockReason: null
    });
    console.log("Successfully unlocked employee record in Firestore: failedLoginAttempts=0, lockedUntil=null, lockReason=null");

  } catch (error) {
    console.error("Error during reset operation:", error);
  }
}

resetHH0005().then(() => process.exit(0));
