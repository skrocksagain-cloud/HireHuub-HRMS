import type { Timestamp } from 'firebase/firestore';

export type ExpenseTransactionStatus = 'Draft' | 'Completed' | 'Cancelled';
export type PayoutStatus = 'Pending' | 'Approved' | 'Rejected' | 'Paid';
export type PaymentMethodType = 'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'NEFT' | 'RTGS';

export interface ExpenseCategory {
  id: string;
  name: string;
  isActive: boolean;
  requiresAssociatePartner: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Read-only Network record used when an expense is paid to an associate partner. */
export interface AssociatePartner {
  id: string;
  name: string;
  isActive: boolean;
}

export interface PaymentSource {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ExpenseTransactionStatusHistoryEntry {
  status: ExpenseTransactionStatus;
  changedAt: Timestamp;
  changedBy: string;
  remarks: string;
}

export interface ExpenseTransaction {
  id: string;
  expenseNumber: string; // Format: HHEXP2026-0001
  transactionNumber: string;
  transactionDate: string;

  expenseCategoryId: string;
  expenseCategoryName: string; // Expense Type (e.g. Office Rent, Salary...)
  expenseType: string;

  paidFromId: string;
  paidFromName: string;
  paidFrom: string; // Company Account OR 'Management'

  paidById?: string; // Active Super Admin employee ID (Populated only when paidFrom = 'Management')
  paidByName?: string; // Active Super Admin employee Name (Populated only when paidFrom = 'Management')

  beneficiary: string; // Vendor, Recruiter, AP, Landlord...
  paymentMethod: PaymentMethodType;

  associatePartnerId?: string;
  associatePartnerName?: string;

  amount: number;
  description: string;
  referenceNumber: string;
  notes: string;

  attachmentName?: string;
  attachmentUrl?: string;

  status: ExpenseTransactionStatus;
  statusHistory: ExpenseTransactionStatusHistoryEntry[];
  createdBy: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RecordExpenseInput {
  expenseNumber?: string;
  transactionDate: string;
  expenseType: string;
  expenseCategoryId: string;
  paidFrom: string; // Company Account OR 'Management'
  paidFromId: string;
  paidById?: string; // Super Admin employee ID when paidFrom = 'Management'
  paidByName?: string; // Super Admin employee name when paidFrom = 'Management'
  beneficiary: string;
  paymentMethod: PaymentMethodType;
  amount: number;
  description: string;
  associatePartnerId?: string;
  referenceNumber?: string;
  notes?: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface ExpenseLedgerEntry {
  id: string;
  transactionId: string;
  transactionNumber: string;
  expenseNumber: string;
  date: string;
  expenseCategoryId: string;
  expenseCategoryName: string;
  amount: number;
  paidFromId: string;
  paidFromName: string;
  paidFrom: string;
  paidByName?: string;
  beneficiary: string;
  description: string;
  createdAt: Timestamp;
}

/** Recruiter Incentive record consumed from CRM + Workforce */
export interface RecruiterIncentivePayout {
  id: string;
  recruiterId: string;
  recruiterName: string;
  candidateId: string;
  candidateName: string;
  placementClientName: string;
  workforceType: 'Payroll' | 'OTS';
  qualificationMonth: string;
  qualificationRule: string;
  incentiveAmount: number;
  status: PayoutStatus;
  approvedBy?: string;
  paidAt?: string;
}

/** Associate Partner Payout record consumed from AP + Workforce + Eligibility */
export interface AssociatePartnerPayout {
  id: string;
  associatePartnerId: string;
  associatePartnerName: string;
  candidateId: string;
  candidateName: string;
  placementClientName: string;
  workforceType: 'Payroll' | 'OTS';
  tenureDays: number;
  eligibilityStatus: 'Eligible' | 'Pending';
  payoutAmount: number;
  status: PayoutStatus;
  approvedBy?: string;
  paidAt?: string;
}

/** Client Payment incoming receipt record */
export interface ClientPaymentRecord {
  id: string;
  invoiceId: string;
  clientId: string;
  clientName: string;
  paymentDate: string;
  amount: number;
  paymentMode: 'NEFT/RTGS' | 'UPI' | 'Cheque' | 'Bank Transfer';
  referenceNumber: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

/** Consolidated Payment History record */
export interface ConsolidatedPaymentHistoryItem {
  id: string;
  date: string;
  type: 'Client Payment' | 'Recruiter Incentive' | 'Associate Partner Payout' | 'Operational Expense';
  partyName: string;
  amount: number;
  referenceNumber: string;
  status: string;
  details: string;
}
