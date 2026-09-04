import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc } from "firebase/firestore";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

async function countCollection(collectionPath) {
    const colRef = collection(db, collectionPath);
    const snap = await getDocs(colRef);
    return snap.size;
}

async function auditCandidateSubcollections(candidatesSnap) {
    const subCollections = ['followUps', 'assignments', 'activity', 'interactions'];
    let total = 0;
    let counts = { followUps: 0, assignments: 0, activity: 0, interactions: 0 };
    
    for (const docSnap of candidatesSnap.docs) {
        for (const sub of subCollections) {
            const size = await countCollection(`crm_candidates/${docSnap.id}/${sub}`);
            counts[sub] += size;
            total += size;
        }
    }
    return { total, counts };
}

async function runAudit() {
    console.log('--- STARTING DEMO DATA AUDIT ---');
    
    // 1. INVOICE
    const invoices = await countCollection('invoices');
    const creditNotes = await countCollection('creditNotes');
    console.log(`\nMODULE: INVOICE`);
    console.log(`Collection: invoices -> Documents: ${invoices}`);
    console.log(`Collection: creditNotes -> Documents: ${creditNotes}`);
    
    // 2. WORKFORCE
    const workforce = await countCollection('workforce');
    const workforceImports = await countCollection('workforce_imports');
    console.log(`\nMODULE: WORKFORCE`);
    console.log(`Collection: workforce -> Documents: ${workforce}`);
    console.log(`Collection: workforce_imports -> Documents: ${workforceImports}`);
    
    // 3. CRM
    const crmCandidatesCol = collection(db, 'crm_candidates');
    const crmCandidatesSnap = await getDocs(crmCandidatesCol);
    const crmCandidates = crmCandidatesSnap.size;
    const crmImports = await countCollection('crm_imports');
    
    console.log(`\nMODULE: CRM`);
    console.log(`Collection: crm_candidates -> Documents: ${crmCandidates}`);
    console.log(`Collection: crm_imports -> Documents: ${crmImports}`);
    
    const subAudit = await auditCandidateSubcollections(crmCandidatesSnap);
    console.log(`Subcollections in crm_candidates:`);
    console.log(` - followUps -> Documents: ${subAudit.counts.followUps}`);
    console.log(` - assignments -> Documents: ${subAudit.counts.assignments}`);
    console.log(` - activity -> Documents: ${subAudit.counts.activity}`);
    console.log(` - interactions -> Documents: ${subAudit.counts.interactions}`);
    
    process.exit(0);
}

runAudit().catch(console.error);
