import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);
async function run() {
  const c = await getDoc(doc(db, 'crm_candidates', '1zA8zMFJY6jskQ9kd2L1'));
  console.log("CANDIDATE 1zA8zMFJY6jskQ9kd2L1:", c.data());
  const c2 = await getDoc(doc(db, 'crm_candidates', 'HHCD-551509'));
  console.log("CANDIDATE HHCD-551509:", c2.data());
}
run();
