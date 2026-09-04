const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

async function run() {
  const ps = await getDocs(collection(db, 'placements'));
  for (const doc of ps.docs) {
    const data = doc.data();
    console.log("ID:", doc.id, "Cand:", data.candidateId, "Client:", data.clientId);
  }
}

run().catch(console.error);
