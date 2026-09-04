import type { WorkforceRecordV2, MonthlyPayoutV2 } from '../types/workforce.v2.types';

export interface WorkforceRepositoryV2 {
  // Returns read models generated from joined queries (Placements + Candidates + Payouts)
  getActiveWorkforceRecords(filters?: any): Promise<WorkforceRecordV2[]>;
  getWorkforceRecordByPlacementId(placementId: string): Promise<WorkforceRecordV2 | null>;
}

export interface MonthlyPayoutRepositoryV2 {
  addPayouts(payouts: MonthlyPayoutV2[]): Promise<void>;
  getPayoutsByPlacement(placementId: string): Promise<MonthlyPayoutV2[]>;
  getPayoutsByClientAndMonth(clientId: string, month: string): Promise<MonthlyPayoutV2[]>;
}
