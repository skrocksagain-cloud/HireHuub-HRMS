import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import fs from "fs";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);
async function run() {
  const w = [];
  const i = [];
  (await getDocs(collection(db, 'workforce'))).forEach(d => w.push({id: d.id, ...d.data()}));
  (await getDocs(collection(db, 'workforce_imports'))).forEach(d => i.push({id: d.id, ...d.data()}));
  fs.writeFileSync('w.json', JSON.stringify(w, null, 2));
  fs.writeFileSync('i.json', JSON.stringify(i, null, 2));
}
run();
