/* eslint-disable */
import {
  incentiveRepository,
  type IncentiveSlab,
  type IncentiveSnapshot,
} from '../repositories/incentiveRepository';
import { performanceService } from '../../People/services/performanceService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import type { WorkforceItem } from '../../Workbench/workforce/types/workforce';

export interface QualifyingCandidateResult {
  candidateId: string;
  candidateName: string;
  clientId: string;
  clientName: string;
  isOtsEligible: boolean;
  isPayrollEligible: boolean;
  isQualifying: boolean;
}

export interface IncentiveCalculationResult {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  brandProfileId: string;
  incentiveMonth: string;
  payoutSalaryMonth: string;
  payoutDate: string;
  achievementPercent: number;
  targetPoints: number;
  actualPoints: number;
  qualifyingCandidateCount: number;
  qualifyingCandidateIds: string[];
  ruleVersion: number;
  totalIncentive: number;
  slabBreakdown: Array<{
    slabId: string;
    description: string;
    fixedContribution: number;
    perCandidateContribution: number;
    totalSlabContribution: number;
  }>;
}

export class IncentiveEngineService {
  /**
   * Helper function to map Incentive Month to Payout Salary Month and 1st of next month Payout Date.
   * Example:
   * July 2026 -> August 2026 Salary -> 2026-09-01 payout
   * August 2026 -> September 2026 Salary -> 2026-10-01 payout
   * September 2026 -> October 2026 Salary -> 2026-11-01 payout
   */
  getPayoutCycleDates(incentiveMonth: string): { payoutSalaryMonth: string; payoutDate: string } {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const parts = incentiveMonth.trim().split(' ');
    const monthName = parts[0];
    const yearNum = parseInt(parts[1], 10) || 2026;

    let idx = months.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
    if (idx === -1) idx = 6; // Default July

    // Payout Salary Month is next month
    const nextMonthIdx = (idx + 1) % 12;
    const salaryYear = idx === 11 ? yearNum + 1 : yearNum;
    const payoutSalaryMonth = `${months[nextMonthIdx]} ${salaryYear}`;

    // Payout Date is 1st of month following salary month
    const payoutMonthIdx = (idx + 2) % 12;
    const payoutYear = idx >= 10 ? yearNum + 1 : yearNum;
    const payoutMonthStr = String(payoutMonthIdx + 1).padStart(2, '0');
    const payoutDate = `${payoutYear}-${payoutMonthStr}-01`;

    return { payoutSalaryMonth, payoutDate };
  }

  /**
   * Evaluates Fixed Eligibility Rules for candidates:
   * RULE 1: OTS Candidate completes client-specific tenure.
   * RULE 2: Payroll Candidate is active for payroll month.
   * RULE 3: BOTH required.
   */
  evaluateCandidateEligibility(candidates: WorkforceItem[]): QualifyingCandidateResult[] {
    return candidates.map((cand) => {
      // For historical purposes, if they are returned by the activeDate filter, they qualify based on tenure
      const isOtsEligible = (cand as any).completedOtsTenure !== false;
      const isPayrollEligible = (cand as any).activeInPayrollMonth !== false;
      const isQualifying = isOtsEligible && isPayrollEligible;

      return {
        candidateId: cand.id,
        candidateName: cand.candidateName || (cand as any).name || 'Candidate',
        clientId: cand.clientId,
        clientName: cand.clientName,
        isOtsEligible,
        isPayrollEligible,
        isQualifying,
      };
    });
  }

  /**
   * Fixed Cumulative Slab Engine:
   * Dynamically accumulates all applicable slab increments based on achievement % and qualifying candidate count.
   */
  calculateCumulativeIncentive(
    achievementPercent: number,
    qualifyingCandidateCount: number,
    slabs: IncentiveSlab[]
  ): {
    totalIncentive: number;
    slabBreakdown: Array<{
      slabId: string;
      description: string;
      fixedContribution: number;
      perCandidateContribution: number;
      totalSlabContribution: number;
    }>;
  } {
    const sortedSlabs = [...slabs]
      .filter((s) => s.active !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.minAchievementPercent - b.minAchievementPercent);

    let totalIncentive = 0;
    const slabBreakdown: Array<{
      slabId: string;
      description: string;
      fixedContribution: number;
      perCandidateContribution: number;
      totalSlabContribution: number;
    }> = [];

    if (achievementPercent < 100) {
      return { totalIncentive: 0, slabBreakdown: [] };
    }

    for (const slab of sortedSlabs) {
      // Fixed Cumulative Rule: If employee achievement % meets or exceeds min threshold of slab, accumulate increment
      if (achievementPercent >= slab.minAchievementPercent) {
        const fixedContrib = Number(slab.fixedAmount) || 0;
        const perCandContrib = (Number(slab.perCandidateAmount) || 0) * qualifyingCandidateCount;
        const totalContrib = fixedContrib + perCandContrib;

        totalIncentive += totalContrib;

        const maxLabel = slab.maxAchievementPercent !== null ? `${slab.maxAchievementPercent}%` : '∞';
        slabBreakdown.push({
          slabId: slab.slabId,
          description: `Slab (${slab.minAchievementPercent}% to ${maxLabel})`,
          fixedContribution: fixedContrib,
          perCandidateContribution: perCandContrib,
          totalSlabContribution: totalContrib,
        });
      }
    }

    return { totalIncentive, slabBreakdown };
  }

  /**
   * Calculates incentive for an employee for a specific month and brand.
   * If a finalized snapshot already exists, returns the snapshot.
   */
  async calculateIncentiveForEmployee(
    employeeId: string,
    brandProfileId: string,
    incentiveMonth: string
  ): Promise<IncentiveSnapshot> {
    // 1. Check existing snapshot
    const existingSnapshot = await incentiveRepository.getSnapshot(employeeId, brandProfileId, incentiveMonth);
    if (existingSnapshot) return existingSnapshot;

    // 2. Fetch Active Incentive Rule Config for Brand
    const ruleConfig = await incentiveRepository.getActiveRuleForBrand(brandProfileId);

    // 3. Fetch Performance Summary for Employee
    const perfSummary = await performanceService.getPerformanceForEmployee(employeeId, incentiveMonth);
    const targetPoints = perfSummary?.targetPoints || 0;
    const actualPoints = perfSummary?.totalPoints || 0;
    const achievementPercent = perfSummary?.achievementPercent || (targetPoints > 0 ? Math.round((actualPoints / targetPoints) * 100) : 0);

    // 4. Fetch Candidate Placements for Employee
    let workforceCandidates: WorkforceItem[] = [];
    try {
      const snap = await getDocs(collection(db, 'workforce'));
      workforceCandidates = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as WorkforceItem))
        .filter((c) => {
          let monthMatches = false;
          if (c.activeDate) {
            try {
              const d = new Date(c.activeDate);
              if (!isNaN(d.getTime())) {
                const monthStr = `${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`;
                monthMatches = monthStr.toLowerCase() === incentiveMonth.toLowerCase();
              }
            } catch {
              // ignore
            }
          }
          return monthMatches && (c.recruiterId === employeeId || c.recruiterName === perfSummary?.employeeName);
        });
    } catch {
      workforceCandidates = [];
    }

    // 5. Evaluate Fixed Eligibility
    const candidateEligibility = this.evaluateCandidateEligibility(workforceCandidates);
    const qualifyingCandidates = candidateEligibility.filter((c) => c.isQualifying);
    const qualifyingCount = qualifyingCandidates.length;

    // 6. Calculate Cumulative Incentive using Configured Slabs
    const { totalIncentive, slabBreakdown } = this.calculateCumulativeIncentive(
      achievementPercent,
      qualifyingCount,
      ruleConfig.slabs
    );

    // 7. Calculate Payout Cycle Dates
    const { payoutSalaryMonth, payoutDate } = this.getPayoutCycleDates(incentiveMonth);

    return {
      id: `${employeeId}_${brandProfileId}_${incentiveMonth}`,
      employeeId,
      employeeName: perfSummary?.employeeName || 'Employee',
      employeeCode: perfSummary?.employeeCode || employeeId,
      brandProfileId,
      incentiveMonth,
      payoutSalaryMonth,
      payoutDate,
      achievementPercent,
      targetPoints,
      actualPoints,
      qualifyingCandidateCount: qualifyingCount,
      qualifyingCandidateIds: qualifyingCandidates.map((c) => c.candidateId),
      ruleVersion: ruleConfig.ruleVersion,
      totalIncentive,
      slabBreakdown,
    };
  }
}

export const incentiveEngineService = new IncentiveEngineService();
