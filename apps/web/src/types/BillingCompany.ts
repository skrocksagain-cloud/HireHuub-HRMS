import type { Timestamp } from 'firebase/firestore';

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
}

export interface BillingConfiguration {
  financialYearStartMonth: number;
  invoiceSequencePadding: number;
}

export interface BillingCompany {
  id: string;
  companyName: string;
  legalName: string;
  gstin: string;
  pan: string;
  registeredAddress: BillingAddress;
  bankDetails: BankDetails;
  invoicePrefix: string;
  invoiceTemplateId: string;
  invoiceTemplateVersion: number;
  authorizedSignatory: string;
  isActive: boolean;
  configuration: BillingConfiguration;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BillingCompanyInput {
  companyName: string;
  legalName: string;
  gstin: string;
  pan: string;
  registeredAddress: BillingAddress;
  bankDetails: BankDetails;
  invoicePrefix: string;
  invoiceTemplateId: string;
  invoiceTemplateVersion: number;
  authorizedSignatory: string;
  isActive: boolean;
  configuration: BillingConfiguration;
}

export type GstType = 'CGST_SGST' | 'IGST';

export interface GstResolution {
  type: GstType;
  billingCompanyState: string;
  clientBillingState: string;
}

export interface InvoiceTemplateResolution {
  billingCompanyId: string;
  templateId: string;
  templateVersion: number;
}

export interface InvoiceNumber {
  value: string;
  financialYear: string;
  sequence: number;
}
