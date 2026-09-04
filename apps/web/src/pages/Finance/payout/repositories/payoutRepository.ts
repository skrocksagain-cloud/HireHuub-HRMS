import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../firebase/firebase';
import type { OtsBillingRecord, PayoutBatchRecord } from '../types';

const otsBillingCollection = collection(db, 'finance_ots_billing');
const payoutBatchesCollection = collection(db, 'finance_payout_batches');

export class PayoutRepository {
  async getOtsBillingRecords(clientId: string): Promise<OtsBillingRecord[]> {
    const q = query(otsBillingCollection, where('clientId', '==', clientId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as OtsBillingRecord));
  }

  async markOtsAsBilled(record: Omit<OtsBillingRecord, 'id'>): Promise<string> {
    const docRef = await addDoc(otsBillingCollection, record);
    return docRef.id;
  }

  async getPayoutBatches(clientId: string, month: string, year: string, weekNumber: string): Promise<PayoutBatchRecord[]> {
    const q = query(
      payoutBatchesCollection, 
      where('clientId', '==', clientId),
      where('month', '==', month),
      where('year', '==', year),
      where('weekNumber', '==', weekNumber)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as PayoutBatchRecord));
  }

  async createPayoutBatch(batch: Omit<PayoutBatchRecord, 'id'>): Promise<string> {
    const docRef = await addDoc(payoutBatchesCollection, batch);
    return docRef.id;
  }
}

export const payoutRepository = new PayoutRepository();
