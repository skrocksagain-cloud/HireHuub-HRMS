import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';

export async function allocateNextOtsEmployeeId(transaction: any, db: any): Promise<string> {
  const sequenceRef = doc(db, 'system_sequences', 'ots_employee_id');
  const sequenceSnap = await transaction.get(sequenceRef);
  let seqCurrent = sequenceSnap.exists() ? (sequenceSnap.data().current || 0) : 0;
  
  // V2 Storage
  const qV2 = query(collection(db, 'placements'), orderBy('otsEmployeeId', 'desc'), limit(1));
  const snapV2 = await transaction.get(qV2);
  let maxV2 = 0;
  if (!snapV2.empty) {
     const val = snapV2.docs[0].data().otsEmployeeId;
     if (val && val.startsWith('HH/CAN/OTS/')) maxV2 = parseInt(val.split('HH/CAN/OTS/')[1], 10) || 0;
  }
  
  // V1 Storage
  const qV1 = query(
    collection(db, 'crm_candidates'), 
    where('payrollEmployeeId', '>=', 'HH/CAN/OTS/'), 
    where('payrollEmployeeId', '<', 'HH/CAN/OTS0'), 
    orderBy('payrollEmployeeId', 'desc'), 
    limit(1)
  );
  const snapV1 = await transaction.get(qV1);
  
  let maxV1 = 0;
  if (!snapV1.empty) {
     const val = snapV1.docs[0].data().payrollEmployeeId;
     if (val && val.startsWith('HH/CAN/OTS/')) maxV1 = parseInt(val.split('HH/CAN/OTS/')[1], 10) || 0;
  }
  
  const trueMax = Math.max(seqCurrent, maxV2, maxV1);
  const nextNumber = trueMax + 1;
  const newId = `HH/CAN/OTS/${nextNumber.toString().padStart(4, '0')}`;
  
  transaction.set(sequenceRef, { current: nextNumber }, { merge: true });
  return newId;
}
