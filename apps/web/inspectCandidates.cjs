const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

async function run() {
  const ws = await getDocs(collection(db, 'workforce'));
  console.log("Found", ws.size, "workforce docs");

  const cs = await getDocs(collection(db, 'crm_candidates'));
  const candidateIds = new Set(cs.docs.map(d => d.id));
  
  const importsSnap = await getDocs(collection(db, 'workforce_imports'));
  let matchCount = 0;
  for (const doc of importsSnap.docs) {
    const data = doc.data();
    for(const r of data.rows || []) {
      const eid = r.employeeId;
      if (!eid) continue;
      // Is it a workforce doc id?
      const inW = ws.docs.some(d => d.id === eid || d.data().payrollEmployeeId === eid || d.data().otsEmployeeId === eid || d.id === eid.replace('WF-', ''));
      // Is it a candidate id?
      const cid = eid.startsWith('WF-') ? eid.slice(3) : eid;
      const inC = candidateIds.has(cid);
      
      console.log(`Payout eid: ${eid} -> inWorkforce: ${inW}, inCandidate: ${inC}`);
      if(inW || inC) matchCount++;
    }
  }
  console.log("Total matched somehow:", matchCount);
}

run().catch(console.error);
