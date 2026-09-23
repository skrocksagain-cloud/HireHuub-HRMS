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
    actorContext?: { assignedRole?: string; departmentId?: string; employeeId?: string; employeeName?: string; employeeRole?: string }
  ): Promise<{ summaries: PerformanceSummary[]; targets: PerformanceTarget[] }> {
    const scope = getSimplifiedModuleScope(actorContext?.assignedRole);
    const allSummaries = await performanceRepository.getPerformanceSummaries({
      scope,
      assignedRole: actorContext?.assignedRole,
      departmentId: actorContext?.departmentId,
      employeeId: actorContext?.employeeId,
      employeeName: actorContext?.employeeName,
      employeeRole: actorContext?.employeeRole,
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
    currentActiveCandidates: number,
    actorContext?: { assignedRole?: string; departmentId?: string; employeeId?: string; employeeName?: string; employeeRole?: string }
  ): Promise<MonthlyRegisterItem[]> {
    const scope = getSimplifiedModuleScope(actorContext?.assignedRole);
    const [allTargets, historicalAggregates] = await Promise.all([
      performanceTargetRepository.getAllTargetsForBrand(brandId),
      performanceRepository.getMonthlyPerformanceAggregate({
        brandId,
        scope,
        assignedRole: actorContext?.assignedRole,
        departmentId: actorContext?.departmentId,
        employeeId: actorContext?.employeeId,
        employeeName: actorContext?.employeeName,
        employeeRole: actorContext?.employeeRole,
      })
    ]);

    const monthMap = new Map<string, { target: number, achieved: number, totalActive: number }>();

    historicalAggregates.forEach(agg => {
      monthMap.set(agg.month, { target: 0, achieved: agg.totalPoints, totalActive: agg.activeCandidates });
    });

    allTargets.forEach((t) => {
      const existing = monthMap.get(t.month) || { target: 0, achieved: 0, totalActive: 0 };
      existing.target += (t.targetPoints || 0);
      monthMap.set(t.month, existing);
    });

    const currentData = monthMap.get(currentMonth) || { target: 0, achieved: 0, totalActive: 0 };
    if (currentMonthTarget > 0) currentData.target = currentMonthTarget;
    monthMap.set(currentMonth, currentData);

    if (monthMap.size === 0) return [];

    const rows: MonthlyRegisterItem[] = Array.from(monthMap.entries()).map(([m, data]) => {
      const achieved = m === currentMonth && currentMonthPoints > 0 ? currentMonthPoints : data.achieved;
      const totalActive = m === currentMonth && currentActiveCandidates > 0 ? currentActiveCandidates : data.totalActive;
      const achievementPercent = data.target > 0 ? Math.round((achieved / data.target) * 100) : 0;
      const status = data.target > 0 && achievementPercent >= 100 ? 'Achieved' : 'In Progress';

      return {
        month: m,
        target: data.target,
        achieved,
        achievementPercent,
        incentiveAmount: 0,
        totalActive,
        status,
      };
    });

    rows.sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
    return rows;
  }

  async assignTarget(
    input: PerformanceTargetInput,
    actorContext?: { assignedRole?: string; departmentId?: string; employeeId?: string; employeeName?: string; employeeRole?: string }
  ): Promise<void> {
    if (!input.employeeId || !input.brandId || !input.month || input.targetPoints < 0) {
      throw new Error('Valid employee, brand, month, and non-negative target points are required.');
    }
    const { canAssignToEmployee } = await import('../../../core/authorization/authorizationResolver');
    if (actorContext && actorContext.employeeId) {
      // Need to fetch target employee to get their reportingManagerId and departmentId
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      const { db } = await import('../../../firebase/firebase');
      const snap = await getDocs(query(collection(db, 'employees'), where('employeeId', '==', input.employeeId)));
      const targetDoc = snap.docs[0]?.data();

      const targetContext = {
        employeeId: input.employeeId,
        departmentId: targetDoc?.departmentId,
        reportingManagerId: targetDoc?.reportingManagerId
      };

      if (!canAssignToEmployee(actorContext, targetContext)) {
        throw new Error('Not authorized to assign target to this employee.');
      }
    }
    await performanceTargetRepository.saveTarget(input);
  }
}

export const performanceService = new PerformanceService();