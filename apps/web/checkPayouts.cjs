const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, writeBatch } = require("firebase/firestore");

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

async function run() {
  const payouts = await getDocs(collection(db, 'monthly_payouts'));
  let orphanCount = 0;
  let totalCount = 0;
  let batch = writeBatch(db);
  let batched = 0;
  for (const p of payouts.docs) {
    totalCount++;
    const data = p.data();
    if (data.placementId && data.placementId.startsWith('HHPL') && parseInt(data.placementId.replace('HHPL', '')) > 2) {
      batch.update(doc(db, 'monthly_payouts', p.id), { isOrphaned: true });
      batched++;
      orphanCount++;
    }
  }
  if(batched > 0) {
     await batch.commit();
  }
  console.log(`Total payouts: ${totalCount}. Total orphaned: ${orphanCount}.`);
}

run().catch(console.error);
