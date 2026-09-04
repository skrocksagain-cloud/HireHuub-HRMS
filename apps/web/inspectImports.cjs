const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

async function run() {
  const importsSnap = await getDocs(collection(db, 'workforce_imports'));
  console.log("Found", importsSnap.size, "import docs");
  for (const doc of importsSnap.docs) {
    const data = doc.data();
    console.log(`Doc ID: ${doc.id}`);
    console.log(`Rows: ${data.rows ? data.rows.length : 0}`);
    if (data.rows && data.rows.length > 0) {
      console.log(data.rows[0]);
    }
  }
}

run().catch(console.error);
