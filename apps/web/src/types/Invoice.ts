import type { Timestamp } from 'firebase/firestore';

import type { BankDetails, BillingAddress, GstType } from './BillingCompany';

export type InvoiceStatus = 'Draft' | 'Generated' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

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

export interface Invoice {
  id: string;
  clientId: string;
  invoiceDate: string;
  lineItems: InvoiceLineItemInput[];
  status: InvoiceStatus;
  statusHistory: InvoiceStatusHistoryEntry[];
  snapshot?: InvoiceSnapshot;
  document?: InvoiceDocumentStorage;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateInvoiceDraftInput {
  clientId: string;
  invoiceDate: string;
  lineItems: InvoiceLineItemInput[];
}
