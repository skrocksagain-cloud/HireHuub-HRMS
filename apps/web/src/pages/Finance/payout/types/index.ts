export interface PayoutPayrollRow {
  candidateId: string;
  clientId: string;
  clientName: string;
  employeeId: string;
  candidateName: string;
  amount: number;
  bankAccount: string;
  ifsc: string;
  month: string; // e.g. "AUG"
  year: string; // e.g. "2026"
  weekNumber: string; // e.g. "W1"
  transactionDate: string; // e.g. "YYYY-MM-DD"
  customerReferenceNumber: string;
  candidateSource?: string;
  placementId?: string;
  recruitmentTeamLead?: string;
  activationDate?: string;
  ordersCount?: number;
  isValid: boolean;
  exceptions: string[];
}

export interface OtsBillingRecord {
  id: string; // Document ID
  candidateId: string;
  clientId: string;
  clientName: string;
  tenureDays: number;
  billedAt: string;
  billedBy: string;
}

export interface PayoutBatchRecord {
  id: string;
  clientId: string;
  month: string;
  year: string;
  weekNumber: string;
  createdAt: string;
  createdBy: string;
  totalAmount: number;
  candidateIds: string[];
}
