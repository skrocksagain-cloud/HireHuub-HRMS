import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY",
  authDomain: "hirehuub-hrms-86942.firebaseapp.com",
  projectId: "hirehuub-hrms-86942"
});
const db = getFirestore(app);

async function run() {
  const wSnap = await getDocs(collection(db, 'workforce'));
  wSnap.forEach(d => console.log("WORKFORCE", d.id, JSON.stringify(d.data())));
  
  const iSnap = await getDocs(collection(db, 'workforce_imports'));
  iSnap.forEach(d => console.log("IMPORT", d.id, JSON.stringify(d.data())));

  const cSnap = await getDocs(collection(db, 'clients'));
  cSnap.forEach(d => console.log("CLIENT", d.id, JSON.stringify(d.data())));
}
run();
