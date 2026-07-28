import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, Timestamp, updateDoc, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

import { db } from '../../../../firebase/firebase';
import type { CreateInvoiceDraftInput, Invoice, InvoiceDocumentStorage, InvoiceSnapshot, InvoiceStatus, InvoiceStatusHistoryEntry } from '../../../../types/Invoice';

const INVOICES_COLLECTION = 'invoices';

const timestamp = (value: unknown): Timestamp => value instanceof Timestamp ? value : Timestamp.now();

const invoiceFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): Invoice => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    clientId: String(data.clientId ?? ''),
    invoiceDate: String(data.invoiceDate ?? ''),
    lineItems: data.lineItems as Invoice['lineItems'],
    status: data.status as InvoiceStatus,
    statusHistory: (data.statusHistory ?? []).map((entry: InvoiceStatusHistoryEntry) => ({ ...entry, changedAt: timestamp(entry.changedAt) })),
    snapshot: data.snapshot as InvoiceSnapshot | undefined,
    document: data.document as InvoiceDocumentStorage | undefined,
    createdBy: String(data.createdBy ?? ''),
    createdAt: timestamp(data.createdAt),
    updatedAt: timestamp(data.updatedAt),
  };
};

export interface InvoiceRepository {
  createDraft(input: CreateInvoiceDraftInput, createdBy: string): Promise<string>;
  getInvoice(id: string): Promise<Invoice | null>;
  getInvoices(): Promise<Invoice[]>;
  updateDraft(id: string, input: CreateInvoiceDraftInput): Promise<void>;
  completeGeneration(id: string, snapshot: InvoiceSnapshot, document: InvoiceDocumentStorage, statusHistory: InvoiceStatusHistoryEntry[]): Promise<void>;
  updateStatus(id: string, status: InvoiceStatus, statusHistory: InvoiceStatusHistoryEntry[]): Promise<void>;
}

class FirestoreInvoiceRepository implements InvoiceRepository {
  async createDraft(input: CreateInvoiceDraftInput, createdBy: string): Promise<string> {
    const draftStatus: InvoiceStatus = 'Draft';
    const result = await addDoc(collection(db, INVOICES_COLLECTION), {
      ...input,
      status: draftStatus,
      statusHistory: [{ status: draftStatus, changedAt: Timestamp.now(), changedBy: createdBy, remarks: 'Invoice draft created.' }],
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return result.id;
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const snapshot = await getDoc(doc(db, INVOICES_COLLECTION, id));
    return snapshot.exists() ? invoiceFrom(snapshot) : null;
  }

  async getInvoices(): Promise<Invoice[]> {
    const result = await getDocs(collection(db, INVOICES_COLLECTION));
    return result.docs.map(invoiceFrom);
  }

  async updateDraft(id: string, input: CreateInvoiceDraftInput): Promise<void> {
    await updateDoc(doc(db, INVOICES_COLLECTION, id), { ...input, updatedAt: serverTimestamp() });
  }

  async completeGeneration(id: string, snapshot: InvoiceSnapshot, document: InvoiceDocumentStorage, statusHistory: InvoiceStatusHistoryEntry[]): Promise<void> {
    await updateDoc(doc(db, INVOICES_COLLECTION, id), { status: 'Generated', snapshot, document, statusHistory, updatedAt: serverTimestamp() });
  }

  async updateStatus(id: string, status: InvoiceStatus, statusHistory: InvoiceStatusHistoryEntry[]): Promise<void> {
    await updateDoc(doc(db, INVOICES_COLLECTION, id), { status, statusHistory, updatedAt: serverTimestamp() });
  }
}

export const invoiceRepository: InvoiceRepository = new FirestoreInvoiceRepository();
