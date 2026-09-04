import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);
const auth = getAuth(app);

const employees = [
  { id: 'HH0001', name: 'Swetlana Hazra', role: 'Super Admin', status: 'Active' },
  { id: 'HH0002', name: 'Ananya Basak', role: 'Super Admin', status: 'Active' },
  { id: 'HH0003', name: 'Sumitra Kayal', role: 'Super Admin', status: 'Active' },
  { id: 'HH0006', name: 'Sourav Basak', role: 'Super Admin', status: 'Active' },
  { id: 'HH0008', name: 'Tamalika De', role: 'Master Admin', status: 'Active' },
  { id: 'HH0016', name: 'Ishika Srivastav', role: 'User', status: 'Active' },
  { id: 'HH0017', name: 'Neha Roy', role: 'User', status: 'Active' },
  { id: 'HH0018', name: 'Sudip Adhikary', role: 'User', status: 'Active' },
  { id: 'HH0004', name: 'Shubham Bhaduri', role: 'Super Admin', status: 'Inactive' },
  { id: 'HH0007', name: 'Dali Bhaduri', role: 'Super Admin', status: 'Inactive' }
];

async function run() {
  const results = [];
  
  for (const emp of employees) {
    const email = `${emp.id.toLowerCase()}@hirehuub.local`;
    let uid = null;
    let authAccount = 'None';
    
    if (emp.status === 'Active') {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, "Password@123");
        uid = cred.user.uid;
        authAccount = email;
        console.log(`Created Auth for ${emp.id}: ${uid}`);
      } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
           console.log(`Auth already exists for ${emp.id}, skipping creation.`);
           console.error("Duplicate found, exiting to prevent silent duplicate usage.");
           process.exit(1);
        } else {
           console.error("Error creating user:", e.message);
           process.exit(1);
        }
      }
    } else {
      console.log(`Skipping Auth creation for INACTIVE ${emp.id}`);
    }

    const docRef = doc(db, 'employees', emp.id);
    const snap = await getDoc(docRef);
    
    const data = {
      employeeId: emp.id,
      name: emp.name,
      accountStatus: emp.status,
      role: emp.role,
      email: email,
      updatedAt: new Date().toISOString()
    };

    if (emp.status === 'Active') {
      data.firstLoginCompleted = false;
      data.mustChangePassword = true;
      data.passwordHash = null;
      data.tempPasswordHash = null;
      data.firebaseUid = uid;
      data.failedLoginAttempts = 0;
      data.lockedUntil = null;
      data.lockReason = null;
    }

    if (!snap.exists()) {
      data.createdAt = new Date().toISOString();
      await setDoc(docRef, data);
    } else {
      if (snap.data().mobileNumber) data.mobileNumber = snap.data().mobileNumber;
      if (snap.data().mobileVerified !== undefined) data.mobileVerified = snap.data().mobileVerified;
      if (snap.data().createdAt) data.createdAt = snap.data().createdAt;
      await updateDoc(docRef, data);
    }
    
    results.push({
      id: emp.id,
      name: emp.name,
      role: emp.role,
      status: emp.status,
      uid: uid || 'N/A',
      authAccount: authAccount,
      firstLoginState: emp.status === 'Active' ? 'Configured' : 'N/A',
      result: 'Success'
    });
  }
  
  console.table(results);
  process.exit(0);
}

run().catch(console.error);
