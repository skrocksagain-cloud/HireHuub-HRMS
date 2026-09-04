import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);
const auth = getAuth(app);

const employees = [
  'HH0001', 'HH0002', 'HH0003', 'HH0006', 'HH0008',
  'HH0016', 'HH0017', 'HH0018',
  'HH0004', 'HH0007'
];

async function verify() {
  console.log("Starting backend verification...");
  
  for (const empId of employees) {
    const docRef = doc(db, 'employees', empId);
    const snap = await getDoc(docRef);
    const data = snap.data();
    
    if (data.accountStatus === 'Active') {
      let authSuccess = false;
      try {
        await signInWithEmailAndPassword(auth, data.email, "Password@123");
        authSuccess = true;
      } catch (e) {
        console.error(`Auth failed for ${empId}: ${e.message}`);
      }
      
      const valid = 
        data.employeeId === empId &&
        data.accountStatus === 'Active' &&
        data.firebaseUid && 
        authSuccess &&
        data.firstLoginCompleted === false &&
        data.mustChangePassword === true &&
        data.passwordHash === null;
        
      console.log(`[VERIFY] ${empId} (Active): ${valid ? 'PASSED' : 'FAILED'} | UID: ${data.firebaseUid}`);
    } else if (data.accountStatus === 'Inactive') {
      const valid = 
        data.employeeId === empId &&
        data.accountStatus === 'Inactive' &&
        !data.firebaseUid; // shouldn't exist
      
      let loginBlocked = false;
      try {
        await signInWithEmailAndPassword(auth, data.email || `${empId.toLowerCase()}@hirehuub.local`, "Password@123");
      } catch(e) {
        if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found') {
          loginBlocked = true;
        }
      }
      
      console.log(`[VERIFY] ${empId} (Inactive): ${valid && loginBlocked ? 'PASSED (Blocked as expected)' : 'FAILED'}`);
    }
  }
  
  process.exit(0);
}

verify().catch(console.error);
