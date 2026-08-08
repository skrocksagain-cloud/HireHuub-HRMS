export type AssociatePartnerStatus = 'Active' | 'Inactive';
export type AssociatePartnerType = 'Freelancer' | 'SME';

export type CandidateSubmissionStatus = 'Submitted' | 'Selected' | 'Joined' | 'Rejected';
export type CandidateEligibilityStatus = 'Eligible' | 'Not Eligible';
export type CandidateBillingStatus = 'Pending Billing' | 'Billed' | 'Paid';

export interface AssociatePartnerBankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export interface AssociatePartnerReportingTo {
  employeeId: string;
  employeeName: string;
  designation?: string;
}

export interface AssociatePartnerCandidateSubmission {
  id: string;
  candidateName: string;
  mobileNumber: string;
  state: string;
  clientName: string;
  submissionDate: string;
  status: CandidateSubmissionStatus;
  rejectionReason?: string; // Mandatory if status = Rejected
  joiningDate?: string;
  lastWorkingDay?: string;
  tenure?: string;
  eligibilityStatus?: CandidateEligibilityStatus; // Auto calculated via Joining Date + Client Tenure Condition (Not Eligible -> Eligible)
  billingStatus?: CandidateBillingStatus; // Workflow: Not Eligible -> Eligible -> Pending Billing -> Billed -> Paid
}

export interface AssociatePartnerSyncMetadata {
  sheetId?: string;
  lastSyncedAt?: string;
  syncStatus: 'Synced' | 'Pending' | 'Not Configured';
  databaseTabReady: boolean;
  requirementsTabReady: boolean;
  vacancyTabReady?: boolean;
  openingsTabReady?: boolean;
}

export interface AssociatePartnerDashboardMetrics {
  totalSubmitted: number;
  selected: number;
  joined: number;
  active: number;
  eligible: number;
  pendingBilling: number;
}

export interface AssociatePartner {
  id: string;
  partnerCode: string; // e.g. AP-2026-001
  subVendorName: string; // Sub Vendor Firm / Person Name
  name: string; // Alias for subVendorName
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  type: AssociatePartnerType; // Freelancer | SME
  status: AssociatePartnerStatus;
  reportingTo: AssociatePartnerReportingTo;
  bankDetails: AssociatePartnerBankDetails;
  pan: string;
  aadhaarOrTradeLicence: string;
  syncMetadata: AssociatePartnerSyncMetadata;
  submissions: AssociatePartnerCandidateSubmission[];
  metrics: AssociatePartnerDashboardMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssociatePartnerInput {
  subVendorName: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  type: AssociatePartnerType;
  reportingToEmployeeId: string;
  reportingToEmployeeName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  pan: string;
  aadhaarOrTradeLicence: string;
  sheetId?: string;
}
