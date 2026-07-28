import type { Timestamp } from 'firebase/firestore';

export type ExpenseTransactionStatus = 'Draft' | 'Completed' | 'Cancelled';

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
  transactionNumber: string;
  transactionDate: string;

  expenseCategoryId: string;
  expenseCategoryName: string;

  associatePartnerId?: string;

  associatePartnerName?: string;

  paidFromId: string;
  paidFromName: string;

  amount: number;

  description: string;

  referenceNumber: string;

  notes: string;

  status: ExpenseTransactionStatus;

  statusHistory: ExpenseTransactionStatusHistoryEntry[];

  createdBy: string;

  createdAt: Timestamp;

  updatedAt: Timestamp;
}

export interface RecordExpenseInput {
  transactionDate: string;

  expenseCategoryId: string;

  associatePartnerId?: string;

  paidFromId: string;

  amount: number;

  description: string;

  referenceNumber?: string;

  notes?: string;
}

export interface ExpenseLedgerEntry {
  id: string;

  transactionId: string;

  transactionNumber: string;

  date: string;

  expenseCategoryId: string;

  expenseCategoryName: string;

  amount: number;

  paidFromId: string;

  paidFromName: string;

  description: string;

  createdAt: Timestamp;
}
