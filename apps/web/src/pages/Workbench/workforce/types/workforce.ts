import type { PlacementRecord, SystemAuditRecord } from '../../crm/types/crm';

export type WorkforceType = 'Payroll' | 'OTS';

export type WorkingStatus = 'Working' | 'Not Working';

export type OtsEligibility = 'Eligible' | 'Not Eligible' | 'Pending';

export type OtsBillingStatus = 'Pending' | 'Billed';

export type ImportPeriod = 'Weekly' | 'Fortnightly' | 'Monthly';

/**
 * Workforce Item stores ONLY Workforce-owned operational active employment data:
 * - Employment details & Working Status
 * - Placement History
 * - Payout History
 * - Eligibility
 * - Billing Lifecycle
 * - Employment Timeline
 *
 * Candidate Master fields (Name, Phone, Area, City, Documents) are consumed strictly
 * via reference from CRM (candidateId: HHCDxxxx) with NO data duplication.
 */
export interface WorkforceItem {
  id: string; // Client Employee ID for Payroll, HHWF000001 for OTS
  candidateId: string; // HHCDxxxx (Single Source reference to CRM Candidate Master)
  
  // Consumed from CRM Candidate Master (dynamic getters, non-owned)
  candidateName: string;
  phone: string;
  area: string;
  city: string;

  clientId: string;
  clientName: string;
  workforceType: WorkforceType;
  recruiterId: string;
  recruiterName: string;
  associatePartnerId?: string;
  associatePartnerName?: string;
  teamLeadId?: string;
  teamLeadName?: string;
  activeDate: string; // ISO date string
  workingFrom: string; // Calculated from activeDate
  dateOfBirth?: string;
  joiningDate?: string;
  lastWorkingDate?: string;
  tenureDays: number;
  tenureDisplay: string;
  workingStatus: WorkingStatus;
  totalEarnings: number;
  totalOrders?: number;
  rank?: number;
  eligibility: OtsEligibility;
  billingStatus: OtsBillingStatus;
  activatedBy: string;
  currentAssignee: string;
  reportingTeamLead: string;
  supportsOrders: boolean; // false for Elastic Run or clients without order data
  lastPayoutImportDate?: string;

  // Workforce-owned history arrays
  placementHistory: PlacementRecord[];
  systemAudit: SystemAuditRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientPayoutImportRow {
  employeeId: string;
  candidateName: string;
  earnings: number;
  orders?: number;
  periodStart?: string;
  periodEnd?: string;
  matched: boolean;
  validationStatus: 'Valid' | 'Duplicate Employee ID' | 'Missing Employee ID' | 'Invalid Earnings';
}

export interface ClientPayoutImportRecord {
  id: string;
  version: number;
  clientId: string;
  clientName: string;
  importPeriod: ImportPeriod;
  month: string; // e.g. "2026-07"
  importedAt: string;
  importedBy: string;
  isApproved: boolean;
  isLocked: boolean;
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  duplicateCount: number;
  missingIdCount: number;
  invalidEarningsCount: number;
  totalEarnings: number;
  totalOrders: number;
  columnMapping: Record<string, string>; // Saved mapping for Client ID
  rows: ClientPayoutImportRow[];
}

export interface ColumnMappingConfig {
  clientId: string;
  mapping: Record<string, string>;
  updatedAt: string;
}

export interface ImportValidationSummary {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  duplicateCount: number;
  missingIdCount: number;
  invalidEarningsCount: number;
  canProceed: boolean;
}

export interface WorkforceFilterState {
  workforceType: 'ALL' | WorkforceType;
  client: string;
  recruiter: string;
  associatePartner: string;
  activeMonth: string;
  city: string;
  workingStatus: 'ALL' | WorkingStatus;
  searchQuery: string;
}

export interface WorkforceKpiSummary {
  activeWorkforce: number;
  payrollCount: number;
  otsCount: number;
  workingCount: number;
  notWorkingCount: number;
  hasOrderData: boolean;
  totalOrders?: number;
  averageOrders?: number;
  topPerformerName?: string;
  eligibleForBilling: number;
  pendingBilling: number;
}
