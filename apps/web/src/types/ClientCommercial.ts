export type CommercialType = 'Payroll' | 'OTS';
export type PayoutType = 'Percentage' | 'Amount';
export type PercentageBasis = 'Monthly CTC' | 'Annual CTC';
export type OtsTenureCondition = number;

export interface ClientCommercial {
  type: CommercialType; // ONLY 'Payroll' | 'OTS'
  points: number; // Recruiter Performance Points earned when candidate becomes Active
  payoutType: PayoutType; // 'Percentage' | 'Amount'
  percentageBasis?: PercentageBasis; // 'Monthly CTC' | 'Annual CTC' (if Payout = Percentage)
  percentageRate?: number; // Percentage % (if Payout = Percentage)
  payoutAmount?: number; // Amount ₹ (if Payout = Amount)
  tenureCondition?: OtsTenureCondition; // Visible ONLY when Type = 'OTS' (numeric days, e.g. 90)
  poRequired: boolean;
}

export function formatTenureCondition(condition?: number | string): string {
  if (condition === undefined || condition === null || condition === '') {
    return '90 Days';
  }
  if (typeof condition === 'number') {
    return `${condition} Days`;
  }
  const str = String(condition).trim();
  if (!str) return '90 Days';
  if (str.toLowerCase().endsWith('days')) {
    return str;
  }
  return `${str} Days`;
}

