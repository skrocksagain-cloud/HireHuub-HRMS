import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

function normalizeMobile(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

async function run() {
  const report = {
    candidates: { totalLegacy: 0, uniqueMobiles: 0, duplicateGroups: 0, duplicateRecords: 0, expectedV2: 0, missingMobile: 0 },
    placements: { totalLegacy: 0, active: 0, transferred: 0, terminated: 0, other: 0, duplicateActiveConflicts: 0 },
    clients: { validPayroll: 0, validOTS: 0, missingClient: 0, invalidClient: 0, missingClientType: 0 },
    employees: { payrollMissingId: 0, otsMissingId: 0, invalidOtsFormat: 0, wrongType: 0 },
    ap: { found: 0, notFound: 0, joined: 0, notJoined: 0, ambiguous: 0 },
    payouts: { totalRows: 0, validEmpId: 0, missingEmpId: 0, invalidEmpId: 0, validClient: 0, unmatchedClient: 0, matchedToPlacement: 0, unmatchedToPlacement: 0, totalEarnings: 0, totalOrders: 0 },
    interactions: { total: 0, validCandidate: 0, missingCandidate: 0 },
    assignments: { current: 0, history: 0, invalidRecruiter: 0, missingTeam: 0 }
  };
  const conflicts = [];
  const mappings = { candidates: {}, placements: {}, payouts: {} };

  try {
    const clientsSnap = await getDocs(collection(db, 'clients'));
    const clientsCache = new Map();
    clientsSnap.forEach(c => clientsCache.set(c.id, c.data()));

    const candidatesSnap = await getDocs(collection(db, 'crm_candidates'));
    report.candidates.totalLegacy = candidatesSnap.size;
    const mobileMap = new Map();
    const candidateIds = new Set();
    candidatesSnap.forEach(doc => {
      candidateIds.add(doc.id);
      const data = doc.data();
      if (!data.phone) report.candidates.missingMobile++;
      else {
        const norm = normalizeMobile(data.phone);
        if (!mobileMap.has(norm)) mobileMap.set(norm, []);
        mobileMap.get(norm).push(doc.id);
      }
    });

    report.candidates.uniqueMobiles = mobileMap.size;
    for (const [mobile, ids] of mobileMap.entries()) {
      if (ids.length > 1) {
        report.candidates.duplicateGroups++;
        report.candidates.duplicateRecords += ids.length;
        conflicts.push({ type: 'CRITICAL', ref: `Mobile ${mobile}`, desc: `Duplicate Candidates: ${ids.join(', ')}`, resolution: 'Manual resolution required.' });
      } else {
        report.candidates.expectedV2++;
        mappings.candidates[ids[0]] = ids[0];
      }
    }

    const workforceSnap = await getDocs(collection(db, 'workforce'));
    report.placements.totalLegacy = workforceSnap.size;
    const activePlacementsMap = new Map();
    const placementEmployeeIds = new Set();

    workforceSnap.forEach(wDoc => {
      const data = wDoc.data();
      
      // Assume mapping
      const mappedId = `HHPL${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`;
      mappings.placements[wDoc.id] = mappedId;

      if (data.status === 'Active') report.placements.active++;
      else if (data.status === 'Transferred') report.placements.transferred++;
      else if (data.status === 'Inactive' || data.status === 'Terminated') report.placements.terminated++;
      else report.placements.other++;

      if (data.status === 'Active' && data.candidateId) {
        if (!activePlacementsMap.has(data.candidateId)) activePlacementsMap.set(data.candidateId, []);
        activePlacementsMap.get(data.candidateId).push(wDoc.id);
      }

      if (!data.clientId) report.clients.missingClient++;
      else {
        const cData = clientsCache.get(data.clientId);
        if (!cData) report.clients.invalidClient++;
        else if (!cData.commercial?.type) report.clients.missingClientType++;
        else {
          if (cData.commercial.type === 'Payroll') { 
            report.clients.validPayroll++; 
            if (!data.payrollEmployeeId) report.employees.payrollMissingId++; 
            else placementEmployeeIds.add(data.payrollEmployeeId);
          }
          else if (cData.commercial.type === 'OTS') { 
            report.clients.validOTS++; 
            if (!data.otsEmployeeId) report.employees.otsMissingId++; 
            else if (!data.otsEmployeeId.startsWith('HH/CAN/OTS/')) report.employees.invalidOtsFormat++;
            else placementEmployeeIds.add(data.otsEmployeeId);
          }
        }
      }
    });

    for (const [cId, pIds] of activePlacementsMap.entries()) {
      if (pIds.length > 1) {
        report.placements.duplicateActiveConflicts++;
        conflicts.push({ type: 'CRITICAL', ref: `Candidate ${cId}`, desc: `Multiple active placements: ${pIds.join(', ')}`, resolution: 'Manual correction.' });
      }
    }

    const importsSnap = await getDocs(collection(db, 'workforce_imports'));
    let totalImportRows = 0;
    importsSnap.forEach(pDoc => {
      const data = pDoc.data();
      const rows = data.rows || [];
      rows.forEach(r => {
        totalImportRows++;
        if (!r.employeeId) report.payouts.missingEmpId++; 
        else {
           report.payouts.validEmpId++;
           // Check if it maps to known placements
           if (placementEmployeeIds.has(r.employeeId) || r.employeeId.startsWith('WF-') || r.employeeId === 'xUUBMbrB4gxqv7ouraYE') {
             report.payouts.matchedToPlacement++;
             mappings.payouts[`${data.clientId}-${data.month}-${r.employeeId}`] = `PAYOUT-${r.employeeId}`;
           } else {
             report.payouts.unmatchedToPlacement++;
           }
        }
        report.payouts.totalEarnings += (r.earnings || r.earning || 0);
        report.payouts.totalOrders += (r.orders || 0);
      });
      if (!data.clientId) report.payouts.unmatchedClient++;
      else report.payouts.validClient++;
    });
    report.payouts.totalRows = totalImportRows;

    const intsSnap = await getDocs(collection(db, 'crm_interactions'));
    report.interactions.total = intsSnap.size;
    intsSnap.forEach(i => { if(candidateIds.has(i.data().candidateId)) report.interactions.validCandidate++; else report.interactions.missingCandidate++; });

    const apSnap = await getDocs(collection(db, 'associate_partners'));
    apSnap.forEach(() => { report.ap.found++; });

    const dir = path.dirname(fileURLToPath(import.meta.url));
    fs.writeFileSync(path.join(dir, 'dry_run_results_final.json'), JSON.stringify({ report, conflicts, mappings }, null, 2));
    console.log("SUCCESS");
  } catch(e) {
    console.error(e);
  }
}
run();
