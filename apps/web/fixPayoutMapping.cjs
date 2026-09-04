const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, setDoc, getDoc, writeBatch } = require("firebase/firestore");

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

async function run() {
  console.log("Starting payout mapping fix...");

  // 1. Get current sequence
  const seqRef = doc(db, 'system_sequences', 'placement_id');
  const seqDoc = await getDoc(seqRef);
  let currentHhplSeq = seqDoc.exists() ? seqDoc.data().current : 3;
  function getNextHhpl() {
    const id = `HHPL${currentHhplSeq.toString().padStart(4, '0')}`;
    currentHhplSeq++;
    return id;
  }

  // 2. Fetch clients to get mapping for client-001
  const clientsSnap = await getDocs(collection(db, 'clients'));
  const clientsCache = new Map();
  clientsSnap.forEach(c => clientsCache.set(c.id, c.data()));
  // client-001 -> 0KFlSTxcJTVKTYTDq9f3
  const legacyClientMap = {
    'client-001': '0KFlSTxcJTVKTYTDq9f3'
  };

  // 3. Fetch existing placements to avoid duplicates
  const ps = await getDocs(collection(db, 'placements'));
  const placementMapping = new Map(); // candId_clientId -> placementId
  for (const p of ps.docs) {
    const d = p.data();
    placementMapping.set(`${d.candidateId}_${d.clientId}`, d.placementId || p.id);
  }

  // 4. Fetch crm_candidates to get names
  const candidatesSnap = await getDocs(collection(db, 'crm_candidates'));
  const candidatesCache = new Map();
  candidatesSnap.forEach(c => candidatesCache.set(c.id, c.data()));

  // 5. Process workforce_imports
  const importsSnap = await getDocs(collection(db, 'workforce_imports'));
  let batch = writeBatch(db);
  let batchCount = 0;
  let payoutsCreated = 0;
  let placementsCreated = 0;

  for (const pDoc of importsSnap.docs) {
    const data = pDoc.data();
    const rows = data.rows || [];
    const mappedClientId = legacyClientMap[data.clientId] || data.clientId;
    const clientData = clientsCache.get(mappedClientId);

    if (!clientData) {
      console.log(`Skipping import ${pDoc.id} due to unknown client ${mappedClientId}`);
      continue;
    }

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      if (!r.employeeId) continue;

      let candidateId = null;
      if (r.employeeId.startsWith('WF-')) {
        candidateId = r.employeeId.replace('WF-', '');
      } else if (r.employeeId === 'xUUBMbrB4gxqv7ouraYE') {
        candidateId = 'aIOLiXi1d9SX09RvpzHZ';
      }

      if (!candidateId) continue;

      // Find or create placement
      const mapKey = `${candidateId}_${mappedClientId}`;
      let pId = placementMapping.get(mapKey);

      if (!pId) {
        // Create placement
        pId = getNextHhpl();
        const candData = candidatesCache.get(candidateId) || {};
        const pRef = doc(db, 'placements', pId);
        batch.set(pRef, {
          placementId: pId,
          candidateId: candidateId,
          clientId: mappedClientId,
          clientName: clientData.name || 'Unknown',
          clientType: clientData.commercial?.type || 'Payroll',
          status: 'Active', // Or Terminated? Let's assume Active for migrated data
          activeDate: new Date().toISOString(),
          joiningDate: null,
          lastWorkingDate: null,
          recruiterId: 'unknown',
          recruiterName: 'Unknown Recruiter',
          payrollEmployeeId: clientData.commercial?.type === 'Payroll' ? r.employeeId : null,
          otsEmployeeId: clientData.commercial?.type === 'OTS' ? r.employeeId : null,
          billingStatus: 'Unbilled',
          pointAtActivation: clientData.commercial?.points || 0,
          bigDayBonusAtActivation: 0,
          totalPointAtActivation: clientData.commercial?.points || 0,
          v2Migrated: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        placementMapping.set(mapKey, pId);
        placementsCreated++;
        batchCount++;
      }

      // Create payout row
      const payoutId = `PAY-${pId}-${data.month}-${idx}`;
      const payoutRef = doc(db, 'monthly_payouts', payoutId);
      batch.set(payoutRef, {
        payoutId,
        placementId: pId,
        month: data.month,
        employeeId: r.employeeId,
        snapshotName: r.candidateName || r.name || 'Unknown',
        earnings: r.earnings || r.earning || 0,
        orders: r.orders || 0,
        rank: r.rank || null,
        clientId: mappedClientId,
        v2Migrated: true,
        createdAt: new Date().toISOString()
      });
      payoutsCreated++;
      batchCount++;

      if (batchCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  // Update sequence
  await setDoc(seqRef, { current: currentHhplSeq }, { merge: true });

  console.log(`Successfully migrated ${payoutsCreated} payouts and created ${placementsCreated} missing placements.`);
}

run().catch(console.error);
