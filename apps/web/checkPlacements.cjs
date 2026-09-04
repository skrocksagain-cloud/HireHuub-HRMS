const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

async function run() {
  const ps = await getDocs(collection(db, 'placements'));
  console.log("Placements:", ps.size);
  const pays = await getDocs(collection(db, 'monthly_payouts'));
  console.log("Payouts:", pays.size);
}

run().catch(console.error);
