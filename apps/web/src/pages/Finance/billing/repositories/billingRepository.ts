import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../../../../firebase/firebase';
import type { BillingCompany, BillingCompanyInput } from '../../../../types/BillingCompany';

const BILLING_COMPANIES_COLLECTION = 'billingCompanies';
const BILLING_COUNTERS_COLLECTION = 'billingCounters';

const timestamp = (value: unknown): Timestamp => value instanceof Timestamp ? value : Timestamp.now();

const billingCompanyFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): BillingCompany => {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    companyName: String(data.companyName ?? ''),
    legalName: String(data.legalName ?? ''),
    gstin: String(data.gstin ?? ''),
    pan: String(data.pan ?? ''),
    registeredAddress: data.registeredAddress as BillingCompany['registeredAddress'],
    bankDetails: data.bankDetails as BillingCompany['bankDetails'],
    invoicePrefix: String(data.invoicePrefix ?? ''),
    invoiceTemplateId: String(data.invoiceTemplateId ?? ''),
    invoiceTemplateVersion: Number(data.invoiceTemplateVersion ?? 1),
    authorizedSignatory: String(data.authorizedSignatory ?? ''),
    isActive: Boolean(data.isActive),
    configuration: data.configuration as BillingCompany['configuration'],
    createdAt: timestamp(data.createdAt),
    updatedAt: timestamp(data.updatedAt),
  };
};

export interface BillingRepository {
  getBillingCompany(id: string): Promise<BillingCompany | null>;
  getBillingCompanies(): Promise<BillingCompany[]>;
  createBillingCompany(company: BillingCompanyInput): Promise<string>;
  updateBillingCompany(id: string, company: BillingCompanyInput): Promise<void>;
  nextInvoiceSequence(billingCompanyId: string, financialYear: string): Promise<number>;
  getCurrentInvoiceSequence(billingCompanyId: string, financialYear: string): Promise<number>;
  nextCreditNoteSequence(billingCompanyId: string, financialYear: string): Promise<number>;
  nextTransactionSequence(billingCompanyId: string, financialYear: string): Promise<number>;
}

class FirestoreBillingRepository implements BillingRepository {
  async getBillingCompany(id: string): Promise<BillingCompany | null> {
    const snapshot = await getDoc(doc(db, BILLING_COMPANIES_COLLECTION, id));
    return snapshot.exists() ? billingCompanyFrom(snapshot) : null;
  }

  async getBillingCompanies(): Promise<BillingCompany[]> {
    const result = await getDocs(query(collection(db, BILLING_COMPANIES_COLLECTION), orderBy('companyName')));
    return result.docs.map(billingCompanyFrom);
  }

  async createBillingCompany(company: BillingCompanyInput): Promise<string> {
    const result = await addDoc(collection(db, BILLING_COMPANIES_COLLECTION), {
      ...company,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return result.id;
  }

  async updateBillingCompany(id: string, company: BillingCompanyInput): Promise<void> {
    await updateDoc(doc(db, BILLING_COMPANIES_COLLECTION, id), {
      ...company,
      updatedAt: serverTimestamp(),
    });
  }

  async nextInvoiceSequence(billingCompanyId: string, financialYear: string): Promise<number> {
    return this.nextSequence(billingCompanyId, financialYear, 'invoice');
  }

  async getCurrentInvoiceSequence(billingCompanyId: string, financialYear: string): Promise<number> {
    const counterId = `${billingCompanyId}_invoice_${financialYear}`;
    try {
      const counter = await getDoc(doc(db, BILLING_COUNTERS_COLLECTION, counterId));
      if (counter.exists()) {
        return Number(counter.data()?.lastSequence ?? 0);
      }
    } catch {
      // Fallback
    }
    return 0;
  }

  async nextCreditNoteSequence(billingCompanyId: string, financialYear: string): Promise<number> {
    return this.nextSequence(billingCompanyId, financialYear, 'creditNote');
  }

  async nextTransactionSequence(billingCompanyId: string, financialYear: string): Promise<number> {
    return this.nextSequence(billingCompanyId, financialYear, 'transaction');
  }

  private async nextSequence(billingCompanyId: string, financialYear: string, documentType: 'invoice' | 'creditNote' | 'transaction'): Promise<number> {
    const counterId = `${billingCompanyId}_${documentType}_${financialYear}`;
    const counter = doc(db, BILLING_COUNTERS_COLLECTION, counterId);

    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(counter);
      const sequence = Number(snapshot.data()?.lastSequence ?? 0) + 1;

      transaction.set(counter, {
        billingCompanyId,
        financialYear,
        documentType,
        lastSequence: sequence,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return sequence;
    });
  }
}

export const billingRepository: BillingRepository = new FirestoreBillingRepository();
