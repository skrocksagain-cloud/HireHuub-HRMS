import type { Timestamp } from 'firebase/firestore';

import type { BankDetails, BillingAddress, GstType } from './BillingCompany';

export type InvoiceStatus = 'Draft' | 'Generated' | 'Approved' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export type PaymentModeType = 'Cash' | 'Cheque' | 'UPI' | 'NEFT' | 'RTGS' | 'Bank Transfer' | 'Other';

export interface InvoiceLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
}

export interface InvoiceLineItem extends InvoiceLineItemInput {
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
}

export interface WorkbenchClientInvoiceData {
  clientId: string;
  clientName: string;
  gstin: string;
  billingAddress: BillingAddress;
  billingState: string;
}

export interface InvoiceCompanySnapshot {
  companyName: string;
  legalName: string;
  gstin: string;
  pan: string;
  registeredAddress: BillingAddress;
  bankDetails: BankDetails;
  authorizedSignatory: string;
}

export interface InvoiceClientSnapshot {
  clientId: string;
  clientName: string;
  gstin: string;
  billingAddress: BillingAddress;
  billingState: string;
}

export interface InvoiceGstBreakdown {
  type: GstType;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
}

export interface InvoiceTemplateSnapshot {
  templateId: string;
  templateVersion: number;
}

export interface InvoiceSnapshot {
  invoiceNumber: string;
  invoiceDate: string;
  company: InvoiceCompanySnapshot;
  client: InvoiceClientSnapshot;
  lineItems: InvoiceLineItem[];
  taxableAmount: number;
  gst: InvoiceGstBreakdown;
  grandTotal: number;
  template: InvoiceTemplateSnapshot;
  poNumber?: string;
  remarks?: string;
  amountInWords?: string;
}

export interface InvoiceStatusHistoryEntry {
  status: InvoiceStatus;
  changedAt: Timestamp;
  changedBy: string;
  remarks: string;
}

export interface InvoiceDocumentStorage {
  documentId: string;
  documentVersion: number;
  storagePath: string;
  downloadUrl: string;
  fileSize: number;
  mimeType: string;
  generatedAt: Timestamp;
}

/** Immutable Payment Record inside Payment History */
export interface PaymentHistoryEntry {
  paymentId: string;
  paymentDate: string;
  amountReceived: number;
  candidatePay: number;
  tdsAmount: number;
  settlementValue: number;
  paymentMode: PaymentModeType;
  transactionReference: string;
  remarks?: string;
  createdBy: string;
  createdOn: string;
}

export interface RecordClientPaymentInput {
  paymentDate: string;
  amountReceived: number;
  candidatePay?: number;
  paymentMode: PaymentModeType;
  transactionReference: string;
  remarks?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string;
  invoiceDate: string;
  lineItems: InvoiceLineItemInput[];
  taxableAmount?: number;
  gstAmount?: number;
  grandTotal?: number;
  poNumber?: string;
  remarks?: string;
  status: InvoiceStatus;
  statusHistory: InvoiceStatusHistoryEntry[];
  snapshot?: InvoiceSnapshot;
  document?: InvoiceDocumentStorage;

  // Financial Ledger Summaries
  payments?: PaymentHistoryEntry[];
  totalAmountReceived?: number;
  totalTdsAmount?: number;
  totalSettlementValue?: number;
  totalCandidatePay?: number;
  totalRevenue?: number;
  withheldAmount?: number;
  outstandingAmount?: number;

  isLocked?: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateInvoiceDraftInput {
  clientId: string;
  clientName?: string;
  invoiceDate: string;
  lineItems: InvoiceLineItemInput[];
  invoiceNumber?: string;
  taxableAmount?: number;
  gstAmount?: number;
  grandTotal?: number;
  poNumber?: string;
  remarks?: string;
  selectedStateName?: string;
}
