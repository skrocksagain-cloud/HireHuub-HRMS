import { performanceRepository, type PerformanceSummary } from '../repositories/performanceRepository';
export type { PerformanceSummary };

export class PerformanceService {
  async getPerformanceForEmployee(employeeId: string): Promise<PerformanceSummary | null> {
    return performanceRepository.getPerformanceForEmployee(employeeId);
  }

  async getAllPerformanceSummaries(): Promise<PerformanceSummary[]> {
    return performanceRepository.getAllPerformanceSummaries();
  }
}

export const performanceService = new PerformanceService();
