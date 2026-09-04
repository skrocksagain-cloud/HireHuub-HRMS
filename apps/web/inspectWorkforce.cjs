const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

async function run() {
  const ws = await getDocs(collection(db, 'workforce'));
  console.log("Found", ws.size, "workforce docs");
  for (const doc of ws.docs) {
    const data = doc.data();
    console.log(doc.id, "candidate:", data.candidateId, "payrollId:", data.payrollEmployeeId, "otsId:", data.otsEmployeeId, "status:", data.status, "client:", data.clientId);
  }
}

run().catch(console.error);
