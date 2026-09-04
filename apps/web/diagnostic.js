import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { execSync } from 'child_process';
import fs from 'fs';

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const auth = getAuth(app);
const db = getFirestore(app);

async function diagnose() {
  console.log("--- START DIAGNOSTIC ---");
  
  // 1 & 2. Verify Auth User Email & UID
  console.log("Exporting Firebase users to verify Auth records...");
  execSync('npx firebase auth:export diag_users.json --project hirehuub-hrms-86942', { stdio: 'pipe' });
  
  const usersData = JSON.parse(fs.readFileSync('diag_users.json', 'utf8'));
  const user = usersData.users.find(u => u.localId === 'a6g8XUrtqhafS4RTK9EPHD2ku5A2');
  
  if (user) {
    console.log(`Verified User Found in Firebase Auth:`);
    console.log(`- UID: ${user.localId}`);
    console.log(`- Email: ${user.email}`);
  } else {
    console.log(`User a6g8XUrtqhafS4RTK9EPHD2ku5A2 NOT FOUND in Auth!`);
  }
  
  // 3 & 4. Verify password authentication succeeds
  console.log("\nAttempting Authentication against Production API...");
  const password = "YQpS79bF46jZf7e2Aa1!";
  try {
    const cred = await signInWithEmailAndPassword(auth, "hh0005@hirehuub.local", password);
    console.log(`SUCCESS: Authentication successful for UID: ${cred.user.uid}`);
  } catch (error) {
    console.log(`FAILED: Authentication failed! Reason: ${error.code} - ${error.message}`);
  }

  // 5. Verify Firestore lock fields
  console.log("\nChecking Firestore employees/HH0005...");
  const snap = await getDoc(doc(db, 'employees', 'HH0005'));
  if (snap.exists()) {
    const data = snap.data();
    console.log(`- failedLoginAttempts: ${data.failedLoginAttempts}`);
    console.log(`- lockedUntil: ${data.lockedUntil}`);
    console.log(`- lockReason: ${data.lockReason}`);
    console.log(`- email: ${data.email} (Profile email)`);
  } else {
    console.log("Document not found!");
  }
  
  // Cleanup
  fs.unlinkSync('diag_users.json');
  console.log("--- END DIAGNOSTIC ---");
  process.exit(0);
}

diagnose();
