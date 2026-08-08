export type CommercialType = 'Payroll' | 'OTS';
export type PayoutType = 'Percentage' | 'Amount';
export type PercentageBasis = 'Monthly CTC' | 'Annual CTC';
export type OtsTenureCondition = '30 Days' | '90 Days' | '180 Days';

export interface ClientCommercial {
  type: CommercialType; // ONLY 'Payroll' | 'OTS'
  points: number; // Recruiter Performance Points earned when candidate becomes Active
  payoutType: PayoutType; // 'Percentage' | 'Amount'
  percentageBasis?: PercentageBasis; // 'Monthly CTC' | 'Annual CTC' (if Payout = Percentage)
  percentageRate?: number; // Percentage % (if Payout = Percentage)
  payoutAmount?: number; // Amount ₹ (if Payout = Amount)
  tenureCondition?: OtsTenureCondition; // Visible ONLY when Type = 'OTS' (30 Days | 90 Days | 180 Days)
  poRequired: boolean;
}
