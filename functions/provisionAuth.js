const admin = require('firebase-admin');

// Ensure firebase-admin uses default credentials or emulator. 
// Since we might not have a service account JSON handy, we can initialize it with the default app if logged into firebase CLI, or just pass projectId.
// Wait, the easiest way to interact with Firestore locally without service account in some setups is to use the emulator or the actual credentials. Let's see if there's a local FIREBASE_CONFIG.
// Actually, I can just use the web SDK in a node script in `apps/web` but web SDK might not have admin privileges. Let's stick to `firebase-admin` with application default credentials.

admin.initializeApp({
  projectId: "hirehuub-hrms-86942"
});

const db = admin.firestore();

const employees = [
  { id: 'HH0001', name: 'Swetlana Hazra', status: 'Active', role: 'Super Admin' },
  { id: 'HH0002', name: 'Ananya Basak', status: 'Active', role: 'Super Admin' },
  { id: 'HH0003', name: 'Sumitra Kayal', status: 'Active', role: 'Super Admin' },
  { id: 'HH0004', name: 'Shubham Bhaduri', status: 'Inactive', role: 'Super Admin' },
  { id: 'HH0005', name: 'Somnath Kayal', status: 'Active', role: 'Super Admin' },
  { id: 'HH0006', name: 'Sourav Basak', status: 'Active', role: 'Super Admin' },
  { id: 'HH0007', name: 'Dali Bhaduri', status: 'Inactive', role: 'Super Admin' },
  { id: 'HH0008', name: 'Tamalika De', status: 'Active', role: 'Master Admin' },
  { id: 'HH0016', name: 'Ishika Srivastav', status: 'Active', role: 'User' },
  { id: 'HH0017', name: 'Neha Roy', status: 'Active', role: 'User' },
  { id: 'HH0018', name: 'Sudip Adhikari', status: 'Active', role: 'User' },
];

async function provision() {
  for (const emp of employees) {
    const docRef = db.collection('employees').doc(emp.id);
    const docSnap = await docRef.get();
    
    // In Firebase Auth, if there is already an auth user, we could optionally delete it to ensure a clean slate, but let's just make sure Firestore says firstLoginCompleted = false so that they can go through the first login flow.
    const email = `${emp.id.toLowerCase()}@hirehuub.local`;

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      console.log(`Firebase Auth user exists for ${emp.id}. Deleting to allow clean provisioning...`);
      await admin.auth().deleteUser(userRecord.uid);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        // expected
      } else {
        console.warn(`Warning checking auth for ${emp.id}:`, e.message);
      }
    }

    const data = {
      employeeId: emp.id,
      name: emp.name,
      accountStatus: emp.status === 'Active' ? 'Pending Activation' : 'Inactive',
      role: emp.role,
      email: email,
      firstLoginCompleted: false,
      failedLoginAttempts: 0,
      mobileVerified: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!docSnap.exists) {
      data.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await docRef.set(data);
      console.log(`Created employee ${emp.id}`);
    } else {
      await docRef.update(data);
      console.log(`Updated employee ${emp.id}`);
    }
  }
}

provision().then(() => {
  console.log('Provisioning complete.');
  process.exit(0);
}).catch(err => {
  console.error('Error provisioning:', err);
  process.exit(1);
});
