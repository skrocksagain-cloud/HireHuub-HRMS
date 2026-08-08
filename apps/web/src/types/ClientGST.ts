import type { BillingAddress } from './BillingCompany';

export type GstMode = 'India' | 'IndividualStates' | 'SingleGST' | 'MultiState';

export interface StateGSTRecord {
  id: string;
  stateCode: string;
  stateName: string;
  gstin: string;
  billingName?: string;
  billingAddress?: BillingAddress;
  templateReference?: string;
  templateVersion?: number;
  isGstOptional: boolean;
  isPrimary: boolean;
  isActive: boolean;
}

export interface IndiaFallbackGST {
  stateCode: string;
  stateName: string;
  gstin?: string;
  isUnregistered: boolean;
}

export interface ClientGSTConfig {
  gstMode: GstMode;
  scopeChoice: 'India' | 'IndividualStates';
  oneGstForAllIndia: boolean;
  isGstOptional: boolean;
  stateGstRecords: StateGSTRecord[];
  indiaFallbackGst?: IndiaFallbackGST;
}
