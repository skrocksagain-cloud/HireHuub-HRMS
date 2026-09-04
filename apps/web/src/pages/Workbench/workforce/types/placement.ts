export interface CreatePlacementInput {
  candidateId: string;
  clientId: string;
  clientName: string;
  clientType: 'Payroll' | 'OTS';
  activeDate: string;

  // Payroll-specific fields
  payrollEmployeeId?: string;
  dateOfBirth?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  ifscCode?: string;

  isAutoActivation?: boolean;
}
