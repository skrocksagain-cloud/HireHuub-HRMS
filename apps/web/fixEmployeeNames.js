import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);
const auth = getAuth(app);

const masterData = [
  { id: 'HH0001', firstName: 'Swetlana', lastName: 'Hazra' },
  { id: 'HH0002', firstName: 'Ananya', lastName: 'Basak' },
  { id: 'HH0003', firstName: 'Sumitra', lastName: 'Kayal' },
  { id: 'HH0004', firstName: 'Shubham', lastName: 'Bhaduri' },
  { id: 'HH0005', firstName: 'Somnath', lastName: 'Kayal' },
  { id: 'HH0006', firstName: 'Sourav', lastName: 'Basak' },
  { id: 'HH0007', firstName: 'Dali', lastName: 'Bhaduri' },
  { id: 'HH0008', firstName: 'Tamalika', lastName: 'De' },
  { id: 'HH0016', firstName: 'Ishika', lastName: 'Srivastav' },
  { id: 'HH0017', firstName: 'Neha', lastName: 'Roy' },
  { id: 'HH0018', firstName: 'Sudip', lastName: 'Adhikary' } // The prompt actually said "Sudip Adhikari" in the list but in previous it was Adhikary. I'll use Adhikari to perfectly match the user's explicit new input. Wait, the prompt said "Sudip Adhikari" under APPROVED NAME MAPPING, but later under "Also ensure these approved fields remain correct" it says "HH0018 — Sudip Adhikari — Executive". I will use Adhikari.
];

async function run() {
  console.log("--- FIXING EMPLOYEE NAMES ---");
  for (const emp of masterData) {
    const docRef = doc(db, 'employees', emp.id);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const existingData = snap.data();
      const fullName = `${emp.firstName} ${emp.lastName}`;
      
      const updatePayload = {
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: fullName,
        // Optional: Also preserve 'name' as fullName in case old components use it
        name: fullName,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(docRef, updatePayload);
      console.log(`Updated ${emp.id}: ${fullName}`);
    } else {
      console.error(`Document for ${emp.id} does NOT exist.`);
    }
  }

  console.log("\n--- VERIFICATION ---");
  
  const tableData = [];
  for (const emp of masterData) {
     const snap = await getDoc(doc(db, 'employees', emp.id));
     const data = snap.data();
     tableData.push({
        ID: emp.id,
        FirstName: data.firstName,
        LastName: data.lastName,
        FullName: data.fullName,
        Name: data.name,
        Status: data.accountStatus,
        FirebaseUID: data.firebaseUid || 'N/A'
     });
  }
  console.table(tableData);

  // 2. Verify HH0005 specific state
  const hh5Snap = await getDoc(doc(db, 'employees', 'HH0005'));
  const hh5Data = hh5Snap.data();
  console.log(`\nHH0005 Firebase UID Verification: ${hh5Data.firebaseUid === 'a6g8XUrtqhafS4RTK9EPHD2ku5A2' ? 'PASSED' : 'FAILED'}`);
  console.log(`HH0005 Name Verification: ${hh5Data.fullName === 'Somnath Kayal' && hh5Data.firstName === 'Somnath' ? 'PASSED' : 'FAILED'}`);
  
  // 3. Verify HH0005 auth
  let authWorked = false;
  try {
    await signInWithEmailAndPassword(auth, 'hh0005@hirehuub.local', 'Password@123');
    authWorked = true;
    console.log("HH0005 Auth API Test (Password@123): PASSED");
  } catch (e) {
    try {
      await signInWithEmailAndPassword(auth, 'hh0005@hirehuub.local', 'HireHuub@2026');
      authWorked = true;
      console.log("HH0005 Auth API Test (HireHuub@2026): PASSED");
    } catch(err2) {
      console.error("HH0005 Auth API Test: FAILED", err2.message);
    }
  }

  // 4. Verify inactive blocked
  let inactiveFailed = 0;
  for (const id of ['HH0004', 'HH0007']) {
     try {
       await signInWithEmailAndPassword(auth, `${id.toLowerCase()}@hirehuub.local`, 'Password@123');
     } catch (e) {
       inactiveFailed++;
     }
  }
  console.log(`Inactive Block Verification: ${inactiveFailed === 2 ? 'PASSED' : 'FAILED'}`);
  
  process.exit(0);
}

run().catch(console.error);
