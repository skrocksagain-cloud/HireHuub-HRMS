import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, writeBatch } from "firebase/firestore";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

// Function to safely batch delete all documents in a collection
async function deleteCollection(collectionPath) {
    const colRef = collection(db, collectionPath);
    const snap = await getDocs(colRef);
    const size = snap.size;
    
    let deleted = 0;
    // Batch deletes in chunks of 500 (Firestore limit)
    let batch = writeBatch(db);
    let count = 0;
    
    for (const docSnap of snap.docs) {
        batch.delete(docSnap.ref);
        count++;
        deleted++;
        
        if (count >= 500) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
        }
    }
    
    if (count > 0) {
        await batch.commit();
    }
    
    return deleted;
}

async function deleteCandidateSubcollections(candidateId) {
    const subCollections = ['followUps', 'assignments', 'activity', 'interactions'];
    let total = 0;
    for (const sub of subCollections) {
        total += await deleteCollection(`crm_candidates/${candidateId}/${sub}`);
    }
    return total;
}

async function runCleanup() {
    console.log('--- STARTING DEMO DATA CLEANUP ---');
    
    // 1. INVOICE
    const invoicesCount = (await getDocs(collection(db, 'invoices'))).size;
    const creditNotesCount = (await getDocs(collection(db, 'creditNotes'))).size;
    
    const delInvoices = await deleteCollection('invoices');
    const delCreditNotes = await deleteCollection('creditNotes');
    
    // 2. WORKFORCE
    const workforceCount = (await getDocs(collection(db, 'workforce'))).size;
    const wfImportsCount = (await getDocs(collection(db, 'workforce_imports'))).size;
    
    const delWorkforce = await deleteCollection('workforce');
    const delWfImports = await deleteCollection('workforce_imports');
    
    // 3. CRM
    const crmCandidatesSnap = await getDocs(collection(db, 'crm_candidates'));
    const crmCandidatesCount = crmCandidatesSnap.size;
    const crmImportsCount = (await getDocs(collection(db, 'crm_imports'))).size;
    
    let subTotal = 0;
    for (const docSnap of crmCandidatesSnap.docs) {
        subTotal += await deleteCandidateSubcollections(docSnap.id);
    }
    
    const delCrmCandidates = await deleteCollection('crm_candidates');
    const delCrmImports = await deleteCollection('crm_imports');
    
    console.log('\n--- CLEANUP COMPLETE ---');
    
    // Verify
    const invSnap = await getDocs(collection(db, 'invoices'));
    const creditNotesSnap = await getDocs(collection(db, 'creditNotes'));
    
    const wfSnap = await getDocs(collection(db, 'workforce'));
    const wfImpSnap = await getDocs(collection(db, 'workforce_imports'));
    
    const crmSnap = await getDocs(collection(db, 'crm_candidates'));
    const crmImpSnap = await getDocs(collection(db, 'crm_imports'));
    
    console.log(`\nVERIFICATION:`);
    console.log(`CRM - remaining documents: ${crmSnap.size + crmImpSnap.size}`);
    console.log(`INVOICE - remaining documents: ${invSnap.size + creditNotesSnap.size}`);
    console.log(`WORKFORCE - remaining documents: ${wfSnap.size + wfImpSnap.size}`);
    
    console.log('\n--- DELETION REPORT ---');
    console.log(`MODULE: CRM`);
    console.log(`- crm_candidates: Before=${crmCandidatesCount}, Deleted=${delCrmCandidates}, Remaining=${crmSnap.size}`);
    console.log(`- crm_imports: Before=${crmImportsCount}, Deleted=${delCrmImports}, Remaining=${crmImpSnap.size}`);
    console.log(`- CRM Subcollections (followUps, assignments, activity, interactions): Deleted=${subTotal}`);
    
    console.log(`\nMODULE: INVOICE`);
    console.log(`- invoices: Before=${invoicesCount}, Deleted=${delInvoices}, Remaining=${invSnap.size}`);
    console.log(`- creditNotes: Before=${creditNotesCount}, Deleted=${delCreditNotes}, Remaining=${creditNotesSnap.size}`);
    
    console.log(`\nMODULE: WORKFORCE`);
    console.log(`- workforce: Before=${workforceCount}, Deleted=${delWorkforce}, Remaining=${wfSnap.size}`);
    console.log(`- workforce_imports: Before=${wfImportsCount}, Deleted=${delWfImports}, Remaining=${wfImpSnap.size}`);
    
    process.exit(0);
}

runCleanup().catch(console.error);
