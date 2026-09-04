import type { PlacementV2 } from '../../../placement/v2/types/placement.v2.types';
import { Timestamp } from 'firebase/firestore';

export interface PayrollOperationalDataV2 {
  dateOfBirth?: string;

  aadhaar?: string;
  pan?: string;

  bankAccountNumber?: string;
  ifscCode?: string;

  currentWorkingStatus?: 'Working' | 'Not Working';
}

export interface OtsOperationalDataV2 {
  dateOfBirth?: string;

  tenureDays: number;

  eligibility: 'Eligible' | 'Not Eligible';
  currentWorkingStatus?: 'Working' | 'Not Working';
}

export interface MonthlyPayoutSummaryV2 {
  totalEarnings: number;
  totalOrders: number;
  rank?: number;
}

export interface WorkforceRecordV2 {
  placement: PlacementV2;

  candidate: {
    id: string;
    name: string;
    phone: string;
    area: string;
    city: string;
  };

  associatePartner?: {
    id: string;
    name?: string;
    status: 'Joined' | 'Not Joined' | 'Not Found';
  };

  client: {
    id: string;
    name: string;
    type: 'Payroll' | 'OTS';
  };

  employeeId: string;

  workforceType: 'Payroll' | 'OTS';

  payroll?: PayrollOperationalDataV2;
  ots?: OtsOperationalDataV2;

  monthly?: MonthlyPayoutSummaryV2;
}

export interface MonthlyPayoutV2 {
  id: string; // Document ID

  placementId: string;
  candidateId: string;

  clientId: string;

  month: string; // YYYY-MM

  date: string; // Exact import date

  employeeId: string;

  nameSnapshot: string;

  earning: number;
  orders: number;

  importedAt: string | Timestamp;
}
