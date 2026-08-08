import type { Timestamp } from 'firebase/firestore';

import type { BillingAddress } from './BillingCompany';
import type { ClientCommercial } from './ClientCommercial';
import type { ClientGSTConfig } from './ClientGST';
import type { ClientSPOC } from './ClientSPOC';

export type ClientStatus = 'Active' | 'Inactive';
export type UserRole = 'Super Admin' | 'Marketing' | 'Staffing' | 'Finance';

export interface ClientPayrollConfig {
  isEnabled: boolean;
  isActiveInLastMonth: boolean;
}

export interface ClientOwnership {
  ownerId: string;
  ownerName: string;
  createdById: string;
}

export interface ClientInvoiceConfig {
  templateReference: string;
  templateVersion: number;
}

export interface ClientFinanceSummary {
  totalInvoices: number;
  outstandingAmount: number;
  totalCreditNotes: number;
}

export interface Client {
  id: string;
  name: string; // Short / Commonly Used Name (e.g. Elastic Run)
  billingName: string; // Legal Name (e.g. Ntex Logistics Pvt Ltd)
  billingAddress: BillingAddress;
  gstin: string;
  state: string;
  type: string;
  status: ClientStatus;
  points: number; // Recruiter Performance Points (earned per active candidate activation)
  highlights: string[];
  payroll: ClientPayrollConfig;
  ownership: ClientOwnership;
  commercial: ClientCommercial;
  gstConfig: ClientGSTConfig;
  spocs: ClientSPOC[];
  invoiceConfig: ClientInvoiceConfig;
  financeSummary?: ClientFinanceSummary;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface CreateClientInput {
  name: string;
  billingName: string;
  billingAddress: BillingAddress;
  gstin: string;
  state: string;
  type: string;
  status: ClientStatus;
  points?: number;
  highlights?: string[];
  payroll?: ClientPayrollConfig;
  ownership?: ClientOwnership;
  commercial: ClientCommercial;
  gstConfig: ClientGSTConfig;
  spocs: ClientSPOC[];
  invoiceConfig: ClientInvoiceConfig;
}
