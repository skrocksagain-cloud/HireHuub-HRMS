import type { WorkforceItem } from '../types/workforce';

export class PerformanceCalculationService {
  /**
   * Computes recruiter incentive performance points based on Client Master configuration.
   */
  static computeRecruiterPoints(item: WorkforceItem, clientPoints: number): number {
    if (item.workforceType === 'Payroll' && item.workingStatus === 'Working') {
      return clientPoints;
    }

    if (item.workforceType === 'OTS' && item.eligibility === 'Eligible') {
      return clientPoints;
    }

    return 0;
  }
}
