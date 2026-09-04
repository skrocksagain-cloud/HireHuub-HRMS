import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, writeBatch } from "firebase/firestore";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

function normalizeMobile(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

// Ensure stable HHPL mapping
let currentHhplSeq = 1;
function getNextHhpl() {
  const id = `HHPL${currentHhplSeq.toString().padStart(4, '0')}`;
  currentHhplSeq++;
  return id;
}

async function run() {
  console.log("Starting Migration...");

  // 1. Fetch Clients
  const clientsSnap = await getDocs(collection(db, 'clients'));
  const clientsCache = new Map();
  clientsSnap.forEach(c => clientsCache.set(c.id, c.data()));

  // 1.5 Fetch Big Days
  const bigDaysSnap = await getDocs(collection(db, 'admin_big_day'));
  const bigDays = [];
  bigDaysSnap.forEach(d => bigDays.push(d.data()));

  // 2. Fetch Candidates
  const candidatesSnap = await getDocs(collection(db, 'crm_candidates'));
  const mobileMap = new Map();
  const candidatesToMigrate = [];
  
  candidatesSnap.forEach(cDoc => {
    const data = cDoc.data();
    if (data.phone) {
      const norm = normalizeMobile(data.phone);
      if (!mobileMap.has(norm)) mobileMap.set(norm, []);
      mobileMap.get(norm).push({ id: cDoc.id, data });
    } else {
      // keep missing mobile just in case
      candidatesToMigrate.push({ id: cDoc.id, data, isDuplicate: false });
    }
  });

  for (const [mobile, arr] of mobileMap.entries()) {
    if (arr.length > 1) {
      // Duplicates exist. Keep the first one as authoritative, others marked as duplicates (or we just migrate all but flag them).
      // The rule says "Normalize mobile and preserve the current duplicate-protection rule. Do not create duplicate Candidates."
      // Since it's existing data, we will just update them in-place with the normalized mobile so the V2 rules apply.
      arr.forEach((item, idx) => {
        candidatesToMigrate.push({ ...item, isDuplicate: idx > 0 });
      });
    } else {
      candidatesToMigrate.push({ ...arr[0], isDuplicate: false });
    }
  }

  const batchSize = 100;
  let batch = writeBatch(db);
  let count = 0;

  // Update CRM Candidates in-place for V2 fields
  console.log("Migrating Candidates in-place...");
  for (const c of candidatesToMigrate) {
    const cRef = doc(db, 'crm_candidates', c.id);
    const updatePayload = {
      normalizedMobile: normalizeMobile(c.data.phone),
      // we don't destroy legacy fields, just ensure V2 fields exist
      v2Migrated: true
    };
    batch.update(cRef, updatePayload);
    count++;
    if (count % batchSize === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  await batch.commit();
  console.log(`Updated ${count} candidates.`);

  // 3. Migrate Placements from workforce
  batch = writeBatch(db);
  count = 0;
  console.log("Migrating Placements...");
  const workforceSnap = await getDocs(collection(db, 'workforce'));
  
  const activePlacementsMap = new Map();
  
  // Sort or process deterministically
  const wDocs = [];
  workforceSnap.forEach(d => wDocs.push({ id: d.id, data: d.data() }));
  
  // Build a placement mapping for payouts
  const placementMapping = new Map(); // candidateId_clientId -> placementId
  const placementEmployeeIdMap = new Map(); // employeeId -> placementId

  for (const w of wDocs) {
    const data = w.data;
    const cData = data.clientId ? clientsCache.get(data.clientId) : null;
    if (!cData || !cData.commercial?.type) continue; // skip invalid clients per dry run

    const hhpl = getNextHhpl();
    
    // Determine Employee ID
    let employeeId = null;
    if (cData.commercial.type === 'Payroll') {
      employeeId = data.payrollEmployeeId || null;
    } else if (cData.commercial.type === 'OTS') {
      employeeId = data.otsEmployeeId || null;
    }

    const activeDate = data.activeDate || data.createdAt || new Date().toISOString();
    const activeStr = activeDate.split('T')[0];

    const matchBigDay = bigDays.find(b => b.date === activeStr && (!b.clients || b.clients.length === 0 || b.clients.includes(data.clientId)));
    const normalPoints = cData.commercial?.points || 0;
    const bigDayBonus = matchBigDay ? 0.5 : 0;
    const totalPoints = normalPoints + bigDayBonus;

    const pRef = doc(db, 'placements', hhpl);
    const placementDoc = {
      placementId: hhpl,
      candidateId: data.candidateId,
      clientId: data.clientId,
      clientName: cData.name || 'Unknown',
      clientType: cData.commercial.type,
      status: (data.status === 'Inactive' || data.status === 'Terminated') ? 'Terminated' : (data.status || 'Active'),
      activeDate: activeDate,
      joiningDate: data.joiningDate || null,
      lastWorkingDate: data.lastWorkingDate || null,
      recruiterId: data.recruiterId || 'unknown',
      recruiterName: data.recruiterName || 'Unknown Recruiter',
      payrollEmployeeId: cData.commercial.type === 'Payroll' ? employeeId : null,
      otsEmployeeId: cData.commercial.type === 'OTS' ? employeeId : null,
      billingStatus: 'Unbilled',
      pointAtActivation: normalPoints,
      bigDayBonusAtActivation: bigDayBonus,
      totalPointAtActivation: totalPoints,
      v2Migrated: true,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    batch.set(pRef, placementDoc);
    placementMapping.set(`${data.candidateId}_${data.clientId}`, hhpl);
    if (employeeId) placementEmployeeIdMap.set(employeeId, hhpl);

    count++;
    if (count % batchSize === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  await batch.commit();
  console.log(`Migrated ${count} placements.`);

  // Update Sequence
  await setDoc(doc(db, 'system_sequences', 'placement_id'), { current: currentHhplSeq }, { merge: true });

  // 4. Migrate Payouts
  batch = writeBatch(db);
  count = 0;
  console.log("Migrating Payouts...");
  const importsSnap = await getDocs(collection(db, 'workforce_imports'));
  
  let payoutCount = 0;
  for (const pDoc of importsSnap.docs) {
    const data = pDoc.data();
    const rows = data.rows || [];
    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      if (!r.employeeId) continue;
      
      let pId = placementEmployeeIdMap.get(r.employeeId);
      if (!pId) continue;

      const payoutId = `PAY-${pId}-${data.month}-${idx}`;
      const payoutRef = doc(db, 'monthly_payouts', payoutId);
      batch.set(payoutRef, {
        payoutId,
        placementId: pId,
        month: data.month,
        employeeId: r.employeeId,
        snapshotName: r.name || r.candidateName || 'Unknown',
        earnings: r.earnings || r.earning || 0,
        orders: r.orders || 0,
        rank: r.rank || null,
        clientId: data.clientId,
        v2Migrated: true,
        createdAt: new Date().toISOString()
      });
      payoutCount++;
      count++;
      if (count % batchSize === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
  }
  await batch.commit();
  console.log(`Migrated ${payoutCount} payouts.`);

  console.log("MIGRATION COMPLETE.");
}

run().catch(console.error);
