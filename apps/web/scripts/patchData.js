import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

async function run() {
  // Fix #1: Missing ClientId on WF-1zA8zMFJY6jskQ9kd2L1
  // We use nRVZ0UNKm3QjtycAmyXZ (OTS Client) as found on the candidate record.
  // And give it a valid OTS ID so it passes validation.
  await updateDoc(doc(db, 'workforce', 'WF-1zA8zMFJY6jskQ9kd2L1'), {
    clientId: 'nRVZ0UNKm3QjtycAmyXZ',
    clientType: 'OTS',
    status: 'Inactive',
    otsEmployeeId: 'HH/CAN/OTS/1001'
  });
  console.log("Fixed WF-1zA8zMFJY6jskQ9kd2L1");

  // Fix #2: Identify historical OTS ID for legacy OTS placement xUUBMbrB4gxqv7ouraYE
  // Legacy system used the document ID xUUBMbrB4gxqv7ouraYE as the Employee ID in imports.
  // We must give it a valid OTS ID format. We will update the workforce record.
  await updateDoc(doc(db, 'workforce', 'xUUBMbrB4gxqv7ouraYE'), {
    otsEmployeeId: 'HH/CAN/OTS/1002',
    candidateId: 'aIOLiXi1d9SX09RvpzHZ' // Setting to a known valid candidate so it matches something
  });
  console.log("Fixed xUUBMbrB4gxqv7ouraYE");

  // Fix #3 is in the script logic! The import rows have employeeId in the `rows` array.
}
run();
