import { getSimplifiedModuleScope } from '../../../core/authorization/authorizationResolver';
import {
  performanceRepository,
  type PerformanceSummary,
} from '../repositories/performanceRepository';
import {
  performanceTargetRepository,
  type PerformanceTarget,
  type PerformanceTargetInput,
} from '../repositories/performanceTargetRepository';
import { incentiveEngineService } from '../../Management/services/incentiveEngineService';

export type { PerformanceSummary, PerformanceTarget, PerformanceTargetInput };

export interface MonthlyRegisterItem {
  month: string;
  target: number;
  achieved: number;
  achievementPercent: number;
  incentiveAmount: number;
  totalActive: number;
  status: string;
}

export class PerformanceService {
  async getPerformanceForEmployee(employeeId: string, month?: string): Promise<PerformanceSummary | null> {
    return performanceRepository.getPerformanceForEmployee(employeeId, month);
  }

  async getAllPerformanceSummaries(month?: string): Promise<PerformanceSummary[]> {
    return performanceRepository.getAllPerformanceSummaries(month);
  }

  async getPerformanceForBrand(
    brandId: string,
    month: string,
    actorContext?: { assignedRole?: string; departmentId?: string; employeeId?: string }
  ): Promise<{ summaries: PerformanceSummary[]; targets: PerformanceTarget[] }> {
    const scope = getSimplifiedModuleScope(actorContext?.assignedRole);
    const allSummaries = await performanceRepository.getPerformanceSummaries({
      scope,
      departmentId: actorContext?.departmentId,
      employeeId: actorContext?.employeeId,
      month,
    });

    const targets = await performanceTargetRepository.getTargetsForMonth(brandId, month);

    const targetMap = new Map<string, number>();
    targets.forEach((t) => {
      targetMap.set(t.employeeId, t.targetPoints);
    });

    const enrichedSummaries = await Promise.all(
      allSummaries.map(async (s) => {
        const target = targetMap.get(s.employeeId) || 0;
        const pct = target > 0 ? Math.round((s.totalPoints / target) * 100) : 0;
        let incAmt = 0;
        try {
          const snapshot = await incentiveEngineService.calculateIncentiveForEmployee(
            s.employeeId,
            brandId,
            month
          );
          if (snapshot) incAmt = snapshot.totalIncentive;
        } catch {
          incAmt = 0;
        }

        return {
          ...s,
          targetPoints: target,
          achievementPercent: pct,
          incentiveAmount: incAmt,
        };
      })
    );

    return { summaries: enrichedSummaries, targets };
  }

  async getMonthlyRegisterForBrand(
    brandId: string,
    currentMonth: string,
    currentMonthTarget: number,
    currentMonthPoints: number,
    currentActiveCandidates: number
  ): Promise<MonthlyRegisterItem[]> {
    const allTargets = await performanceTargetRepository.getAllTargetsForBrand(brandId);

    const monthMap = new Map<string, number>();
    allTargets.forEach((t) => {
      const existing = monthMap.get(t.month) || 0;
      monthMap.set(t.month, existing + (t.targetPoints || 0));
    });

    if (currentMonthTarget > 0 || currentMonthPoints > 0) {
      monthMap.set(currentMonth, currentMonthTarget);
    }

    if (monthMap.size === 0) return [];

    const rows: MonthlyRegisterItem[] = Array.from(monthMap.entries()).map(([m, target]) => {
      const achieved = m === currentMonth ? currentMonthPoints : 0;
      const totalActive = m === currentMonth ? currentActiveCandidates : 0;
      const achievementPercent = target > 0 ? Math.round((achieved / target) * 100) : 0;
      const status = target > 0 && achievementPercent >= 100 ? 'Achieved' : 'In Progress';

      return {
        month: m,
        target,
        achieved,
        achievementPercent,
        incentiveAmount: 0, // Computed dynamically from snapshots
        totalActive,
        status,
      };
    });

    return rows;
  }

  async assignTarget(input: PerformanceTargetInput): Promise<void> {
    if (!input.employeeId || !input.brandId || !input.month || input.targetPoints < 0) {
      throw new Error('Valid employee, brand, month, and non-negative target points are required.');
    }
    await performanceTargetRepository.saveTarget(input);
  }
}

export const performanceService = new PerformanceService();
