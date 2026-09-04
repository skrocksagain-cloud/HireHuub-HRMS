const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

async function run() {
  const cs = await getDocs(collection(db, 'clients'));
  for (const doc of cs.docs) {
    console.log(doc.id, doc.data().name, doc.data().type, doc.data().commercial?.type);
  }
}

run().catch(console.error);
