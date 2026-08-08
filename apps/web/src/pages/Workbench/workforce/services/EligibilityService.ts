import type { OtsEligibility, WorkforceItem } from '../types/workforce';

export class EligibilityService {
  /**
   * Automatically calculates OTS Candidate Eligibility based on tenure vs Client Master tenure condition.
   * Client Master tenure conditions: '30 Days', '90 Days', '180 Days'.
   */
  static calculateOtsEligibility(tenureDays: number, clientTenureCondition?: string): OtsEligibility {
    const requiredDays = this.parseTenureConditionDays(clientTenureCondition || '90 Days');
    
    if (tenureDays >= requiredDays) {
      return 'Eligible';
    }
    
    return 'Pending';
  }

  /**
   * Helper to parse string tenure conditions ('30 Days', '90 Days', '180 Days') into numeric days.
   */
  static parseTenureConditionDays(condition: string): number {
    const clean = condition.trim().toLowerCase();
    if (clean.includes('30')) return 30;
    if (clean.includes('180')) return 180;
    return 90; // Default frozen PO rule: 90 Days
  }

  /**
   * Determines if candidate qualifies for Recruiter Incentive payout under frozen business rules.
   * - Payroll: Candidate must be Working during qualifying payout period.
   * - OTS: Candidate Eligibility MUST be 'Eligible'.
   */
  static isRecruiterIncentiveEligible(item: WorkforceItem): boolean {
    if (item.workforceType === 'Payroll') {
      return item.workingStatus === 'Working';
    }

    if (item.workforceType === 'OTS') {
      return item.eligibility === 'Eligible';
    }

    return false;
  }
}
