import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, "test_read_1@hirehuub.local", "Password@123");
    
    const blinkitQ = query(collection(db, 'workforce_imports'), where('clientId', '==', '3RysiPOv9pC4B2vsr0sT'), where('month', '==', '2026-09'));
    const bSnap = await getDocs(blinkitQ);
    bSnap.docs.forEach(d => {
       const data = d.data();
       console.log(`ID: ${d.id}, Rows: ${data.rows?.length}, Approved: ${data.isApproved}, importedAt: ${data.importedAt}`);
    });
    
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
run();
