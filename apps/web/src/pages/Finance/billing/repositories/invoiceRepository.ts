import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, Timestamp, updateDoc, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

import { db } from '../../../../firebase/firebase';
import type { CreateInvoiceDraftInput, Invoice, InvoiceDocumentStorage, InvoiceSnapshot, InvoiceStatus, InvoiceStatusHistoryEntry, PaymentHistoryEntry } from '../../../../types/Invoice';

const INVOICES_COLLECTION = 'invoices';

const timestamp = (value: unknown): Timestamp => value instanceof Timestamp ? value : Timestamp.now();

const invoiceFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): Invoice => {
  const data = snapshot.data();
  const rawInvoiceNumber = data.invoiceNumber
    ? String(data.invoiceNumber)
    : data.snapshot?.invoiceNumber
    ? String(data.snapshot.invoiceNumber)
    : undefined;

  const year = data.invoiceDate ? new Date(`${data.invoiceDate}T00:00:00`).getFullYear() : new Date().getFullYear();
  const fallbackNumber = `HH${year}-${snapshot.id.slice(0, 4).toUpperCase()}`;
  const invoiceNumber = rawInvoiceNumber || fallbackNumber;

  const taxableAmount = typeof data.taxableAmount === 'number'
    ? data.taxableAmount
    : (data.snapshot?.taxableAmount ?? 0);
  const gstAmount = typeof data.gstAmount === 'number'
    ? data.gstAmount
    : (data.snapshot?.gst?.totalGstAmount ?? 0);
  const grandTotal = typeof data.grandTotal === 'number'
    ? data.grandTotal
    : (data.snapshot?.grandTotal ?? (taxableAmount + gstAmount));
  const clientName = data.clientName
    ? String(data.clientName)
    : (data.snapshot?.client?.clientName ? String(data.snapshot.client.clientName) : undefined);

  return {
    id: snapshot.id,
    invoiceNumber,
    clientId: String(data.clientId ?? ''),
    clientName,
    invoiceDate: String(data.invoiceDate ?? ''),
    lineItems: data.lineItems as Invoice['lineItems'],
    taxableAmount,
    gstAmount,
    grandTotal,
    poNumber: data.poNumber ? String(data.poNumber) : undefined,
    remarks: data.remarks ? String(data.remarks) : undefined,
    status: data.status as InvoiceStatus,
    statusHistory: (data.statusHistory ?? []).map((entry: InvoiceStatusHistoryEntry) => ({ ...entry, changedAt: timestamp(entry.changedAt) })),
    snapshot: data.snapshot as InvoiceSnapshot | undefined,
    document: data.document as InvoiceDocumentStorage | undefined,
    payments: (data.payments ?? []) as PaymentHistoryEntry[],
    totalAmountReceived: typeof data.totalAmountReceived === 'number' ? data.totalAmountReceived : 0,
    totalTdsAmount: typeof data.totalTdsAmount === 'number' ? data.totalTdsAmount : 0,
    totalSettlementValue: typeof data.totalSettlementValue === 'number' ? data.totalSettlementValue : 0,
    totalCandidatePay: typeof data.totalCandidatePay === 'number' ? data.totalCandidatePay : 0,
    totalRevenue: typeof data.totalRevenue === 'number' ? data.totalRevenue : 0,
    withheldAmount: typeof data.withheldAmount === 'number' ? data.withheldAmount : 0,
    outstandingAmount: typeof data.outstandingAmount === 'number' ? data.outstandingAmount : 0,
    isLocked: Boolean(data.isLocked),
    createdBy: String(data.createdBy ?? ''),
    createdAt: timestamp(data.createdAt),
    updatedAt: timestamp(data.updatedAt),
  };
};

export interface InvoiceTotalsUpdate {
  payments: PaymentHistoryEntry[];
  totalAmountReceived: number;
  totalTdsAmount: number;
  totalSettlementValue: number;
  totalCandidatePay: number;
  totalRevenue: number;
  withheldAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  isLocked: boolean;
  statusHistory: InvoiceStatusHistoryEntry[];
}

export interface InvoiceRepository {
  createDraft(input: CreateInvoiceDraftInput, createdBy: string): Promise<string>;
  getInvoice(id: string): Promise<Invoice | null>;
  getInvoices(): Promise<Invoice[]>;
  updateDraft(id: string, input: CreateInvoiceDraftInput): Promise<void>;
  completeGeneration(id: string, snapshot: InvoiceSnapshot, document: InvoiceDocumentStorage, statusHistory: InvoiceStatusHistoryEntry[]): Promise<void>;
  updateStatus(id: string, status: InvoiceStatus, statusHistory: InvoiceStatusHistoryEntry[]): Promise<void>;
  recordPayment(id: string, update: InvoiceTotalsUpdate): Promise<void>;
}

class FirestoreInvoiceRepository implements InvoiceRepository {
  async createDraft(input: CreateInvoiceDraftInput, createdBy: string): Promise<string> {
    const draftStatus: InvoiceStatus = 'Draft';
    const year = input.invoiceDate ? new Date(`${input.invoiceDate}T00:00:00`).getFullYear() : new Date().getFullYear();
    const invoiceNumber = input.invoiceNumber || `HH${year}-DRAFT`;
    const result = await addDoc(collection(db, INVOICES_COLLECTION), {
      invoiceNumber,
      clientId: input.clientId,
      clientName: input.clientName || '',
      invoiceDate: input.invoiceDate,
      lineItems: input.lineItems,
      taxableAmount: input.taxableAmount ?? 0,
      gstAmount: input.gstAmount ?? 0,
      grandTotal: input.grandTotal ?? 0,
      poNumber: input.poNumber || '',
      remarks: input.remarks || '',
      status: draftStatus,
      statusHistory: [{ status: draftStatus, changedAt: Timestamp.now(), changedBy: createdBy, remarks: 'Invoice draft created.' }],
      payments: [],
      totalAmountReceived: 0,
      totalTdsAmount: 0,
      totalSettlementValue: 0,
      totalCandidatePay: 0,
      totalRevenue: 0,
      withheldAmount: 0,
      outstandingAmount: input.grandTotal ?? 0,
      isLocked: false,
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
    await updateDoc(doc(db, INVOICES_COLLECTION, id), {
      clientId: input.clientId,
      clientName: input.clientName || '',
      invoiceDate: input.invoiceDate,
      lineItems: input.lineItems,
      taxableAmount: input.taxableAmount ?? 0,
      gstAmount: input.gstAmount ?? 0,
      grandTotal: input.grandTotal ?? 0,
      poNumber: input.poNumber || '',
      remarks: input.remarks || '',
      updatedAt: serverTimestamp(),
    });
  }

  async completeGeneration(id: string, snapshot: InvoiceSnapshot, document: InvoiceDocumentStorage, statusHistory: InvoiceStatusHistoryEntry[]): Promise<void> {
    await updateDoc(doc(db, INVOICES_COLLECTION, id), { status: 'Generated', snapshot, document, statusHistory, updatedAt: serverTimestamp() });
  }

  async updateStatus(id: string, status: InvoiceStatus, statusHistory: InvoiceStatusHistoryEntry[]): Promise<void> {
    const isLocked = status === 'Paid';
    await updateDoc(doc(db, INVOICES_COLLECTION, id), { status, isLocked, statusHistory, updatedAt: serverTimestamp() });
  }

  async recordPayment(id: string, update: InvoiceTotalsUpdate): Promise<void> {
    await updateDoc(doc(db, INVOICES_COLLECTION, id), {
      payments: update.payments,
      totalAmountReceived: update.totalAmountReceived,
      totalTdsAmount: update.totalTdsAmount,
      totalSettlementValue: update.totalSettlementValue,
      totalCandidatePay: update.totalCandidatePay,
      totalRevenue: update.totalRevenue,
      withheldAmount: update.withheldAmount,
      outstandingAmount: update.outstandingAmount,
      status: update.status,
      isLocked: update.isLocked,
      statusHistory: update.statusHistory,
      updatedAt: serverTimestamp(),
    });
  }
}

export const invoiceRepository: InvoiceRepository = new FirestoreInvoiceRepository();
