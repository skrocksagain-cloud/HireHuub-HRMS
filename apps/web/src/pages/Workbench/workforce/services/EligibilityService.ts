import type { OtsEligibility, WorkforceItem } from '../types/workforce';

export class EligibilityService {
  /**
   * Automatically calculates OTS Candidate Eligibility based on tenure vs Client Master tenure condition.
   * Client Master tenure conditions: numeric days (e.g., 30, 45, 90, 180, 365) or legacy strings ('90 Days').
   */
  static calculateOtsEligibility(tenureDays: number, clientTenureCondition?: number | string): OtsEligibility {
    const requiredDays = this.parseTenureConditionDays(clientTenureCondition ?? 90);
    
    if (tenureDays >= requiredDays) {
      return 'Eligible';
    }
    
    return 'Not Eligible';
  }

  /**
   * Helper to parse string or numeric tenure conditions into numeric days.
   */
  static parseTenureConditionDays(condition: number | string): number {
    if (typeof condition === 'number') {
      return isNaN(condition) || condition < 1 ? 90 : condition;
    }
    const clean = String(condition).trim();
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      return parsed;
    }
    return 90; // Default frozen PO rule: 90 Days
  }

  /**
   * Determines if candidate qualifies for Recruiter Incentive payout under frozen business rules.
   * - Payroll: Candidate must be Working during the previous completed calendar month.
   * - OTS: Candidate Eligibility MUST be 'Eligible'.
   */
  static isRecruiterIncentiveEligible(item: WorkforceItem, lastMonthWorkingStatus: boolean): boolean {
    if (item.workforceType === 'Payroll') {
      return lastMonthWorkingStatus;
    }

    if (item.workforceType === 'OTS') {
      return item.eligibility === 'Eligible';
    }

    return false;
  }
}
