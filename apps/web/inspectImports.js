import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit } from 'firebase/firestore';
const app = initializeApp({ apiKey: 'AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY', projectId: 'hirehuub-hrms-86942' });
const db = getFirestore(app);
async function run() {
  const snap = await getDocs(query(collection(db, 'workforce_imports'), where('clientName', '==', 'Blinkit'), limit(1)));
  if (snap.empty) { console.log('No imports found'); process.exit(0); }
  const imp = snap.docs[0].data();
  console.log('Import Document:\n', {
    clientId: imp.clientId,
    clientName: imp.clientName,
    isApproved: imp.isApproved,
    importedAt: imp.importedAt,
    month: imp.month
  });
  console.log('First Row:\n', imp.rows && imp.rows[0]);
  process.exit(0);
}
run();
