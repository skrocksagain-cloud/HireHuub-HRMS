import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

async function run() {
  try {
    const snap = await getDocs(collection(db, 'employees'));
    console.log(`Read ${snap.size} employees.`);
    
    // Try writing
    const testDoc = doc(db, 'employees', 'TEST_DOC');
    await setDoc(testDoc, { test: true });
    console.log("Successfully wrote to employees.");
  } catch (err) {
    console.error("Firestore error:", err);
  }
}
run();
