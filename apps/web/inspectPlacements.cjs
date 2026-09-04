const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

async function run() {
  const ps = await getDocs(collection(db, 'placements'));
  for (const doc of ps.docs) {
    const data = doc.data();
    console.log(data.placementId, "cand:", data.candidateId, "client:", data.clientId);
  }
}

run().catch(console.error);
