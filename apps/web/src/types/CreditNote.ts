import type { Timestamp } from 'firebase/firestore';

import type { InvoiceSnapshot, InvoiceTemplateSnapshot } from './Invoice';

export type CreditNoteType = 'Full' | 'Partial';
export type CreditNoteStatus = 'Draft' | 'Generated' | 'Issued' | 'Applied' | 'Cancelled';

export interface CreditNoteLineSelection {
  invoiceLineIndex: number;
  quantity: number;
}

export interface CreditNoteLineItem {
  invoiceLineIndex: number;
  description: string;
  originalQuantity: number;
  creditedQuantity: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
}

export interface CreditNoteGstBreakdown {
  type: InvoiceSnapshot['gst']['type'];
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
}

export interface CreditNoteSnapshot {
  creditNoteNumber: string;
  creditDate: string;
  reason: string;
  creditType: CreditNoteType;
  generatedBy: string;
  originalInvoiceNumber: string;
  originalInvoiceSnapshot: InvoiceSnapshot;
  lineItems: CreditNoteLineItem[];
  taxableAmount: number;
  gst: CreditNoteGstBreakdown;
  grandTotal: number;
  template: InvoiceTemplateSnapshot;
}

export interface CreditNoteStatusHistoryEntry {
  status: CreditNoteStatus;
  changedAt: Timestamp;
  changedBy: string;
  remarks: string;
}

export interface CreditNoteDocumentStorage {
  documentId: string;
  documentVersion: number;
  storagePath: string;
  downloadUrl: string;
  fileSize: number;
  mimeType: string;
  generatedAt: Timestamp;
}

export interface CreditNote {
  id: string;
  originalInvoiceId: string;
  creditType: CreditNoteType;
  creditDate: string;
  reason: string;
  selections: CreditNoteLineSelection[];
  status: CreditNoteStatus;
  statusHistory: CreditNoteStatusHistoryEntry[];
  snapshot?: CreditNoteSnapshot;
  document?: CreditNoteDocumentStorage;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateCreditNoteDraftInput {
  originalInvoiceId: string;
  creditType: CreditNoteType;
  creditDate: string;
  reason: string;
  selections?: CreditNoteLineSelection[];
}
