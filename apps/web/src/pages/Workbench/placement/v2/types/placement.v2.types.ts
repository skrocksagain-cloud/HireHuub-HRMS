import { Timestamp } from 'firebase/firestore';

export type PlacementClientTypeV2 = 'Payroll' | 'OTS';
export type PlacementStatusV2 = 'Active' | 'Transferred' | 'Terminated';

export interface PlacementV2 {
  id: string; // Internal Firestore ID
  placementId?: string; // HHPLxxxx - Business ID

  candidateId: string; // Reference to CandidateV2

  clientId: string;
  clientName: string;

  clientType: PlacementClientTypeV2;

  status: PlacementStatusV2;

  activeDate: string; // ISO Date

  joiningDate?: string; // ISO Date
  lastWorkingDate?: string; // ISO Date

  recruiterId?: string;
  recruiterName?: string;

  associatePartnerId?: string;
  associatePartnerName?: string;

  payrollEmployeeId?: string;
  otsEmployeeId?: string;

  // Captured at time of activation to prevent historical mutations
  pointAtActivation: number;
  bigDayBonusAtActivation: number;
  totalPointAtActivation: number;

  billingStatus?: 'Billed' | 'Unbilled';

  operationalData?: {
    dateOfBirth?: string;
    aadhaar?: string;
    pan?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
  };

  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
}
