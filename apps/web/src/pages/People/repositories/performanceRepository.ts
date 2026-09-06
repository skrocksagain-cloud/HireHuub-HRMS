import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import type { Employee } from '../../Employee/types/Employee';

export interface PerformanceSummary {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  brandId?: string;
  brandName?: string;
  employmentStatus: string;
  monthlyPoints: number;
  totalPoints: number;
  targetPoints: number;
  achievementPercent: number;
  incentiveAmount?: number;
  activeCandidateCount: number;
  clientPointsBreakdown: Array<{
    clientId: string;
    clientName: string;
    activeCount: number;
    pointsPerCandidate: number;
    totalEarned: number;
  }>;
  departmentRank: number;
  companyRank: number;
}

export interface PerformanceRepository {
  getPerformanceForEmployee(employeeId: string, month?: string): Promise<PerformanceSummary | null>;
  getAllPerformanceSummaries(month?: string): Promise<PerformanceSummary[]>;
  getPerformanceSummaries(input: PerformanceScopeQuery): Promise<PerformanceSummary[]>;
}

export interface PerformanceScopeQuery {
  scope: 'SELF' | 'DEPARTMENT' | 'GLOBAL' | 'OWN' | 'TEAM';
  employeeId?: string;
  departmentId?: string;
  month?: string;
}

export class FirestorePerformanceRepository implements PerformanceRepository {

  private async fetchPlacements(input: PerformanceScopeQuery): Promise<any[]> {
    if (input.scope === 'SELF') {
      if (!input.employeeId?.trim()) return [];
      const snap = await getDocs(query(collection(db, 'placements'), where('recruiterId', '==', input.employeeId)));
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) }));
    }
    if (input.scope === 'DEPARTMENT') {
      if (!input.departmentId?.trim()) return [];
      const snap = await getDocs(query(collection(db, 'placements'), where('departmentId', '==', input.departmentId)));
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) }));
    }
    const snap = await getDocs(collection(db, 'placements'));
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) }));
  }

  private async fetchEmployees(input: PerformanceScopeQuery): Promise<Employee[]> {
    if (input.scope === 'SELF') {
      if (!input.employeeId?.trim()) return [];
      const snap = await getDocs(query(collection(db, 'employees'), where('employeeId', '==', input.employeeId)));
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) } as Employee));
    }
    if (input.scope === 'DEPARTMENT') {
      if (!input.departmentId?.trim()) return [];
      const snap = await getDocs(query(collection(db, 'employees'), where('departmentId', '==', input.departmentId)));
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) } as Employee));
    }
    const snap = await getDocs(collection(db, 'employees'));
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) } as Employee));
  }

  async getAllPerformanceSummaries(month?: string): Promise<PerformanceSummary[]> {
    return this.getPerformanceSummaries({ scope: 'GLOBAL', month });
  }

  async getPerformanceSummaries(input: PerformanceScopeQuery): Promise<PerformanceSummary[]> {
    const [allPlacements, employees] = await Promise.all([
      this.fetchPlacements(input),
      this.fetchEmployees(input)
    ]);

    // Filter by activeDate matching the requested month
    let targetPlacements = allPlacements;
    if (input.month) {
      targetPlacements = allPlacements.filter((p) => {
        if (!p.activeDate) return false;
        try {
          const d = new Date(p.activeDate);
          if (isNaN(d.getTime())) return false;
          const placementMonthStr = `${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`;
          return placementMonthStr.toLowerCase() === input.month!.toLowerCase();
        } catch {
          return false;
        }
      });
    }

    // Group target placements by recruiterId / recruiterName
    const recruiterMap = new Map<string, any[]>();
    targetPlacements.forEach((placement) => {
      const key = placement.recruiterId || placement.recruiterName;
      if (!key) return;
      const existing = recruiterMap.get(key) || [];
      existing.push(placement);
      recruiterMap.set(key, existing);
    });

    const summaries: PerformanceSummary[] = employees.map((emp) => {
      const key = emp.employeeId || emp.employeeCode || emp.id || emp.fullName;
      const placementList = recruiterMap.get(key) || recruiterMap.get(emp.fullName) || [];

      // Calculate Client-wise points using snapshot points from Placement
      const clientGroup = new Map<
        string,
        { clientName: string; count: number; pointsPerCand: number; totalEarned: number }
      >();

      placementList.forEach((placement) => {
        const pts = Number(placement.totalPointAtActivation) || 0;
        const basePts = Number(placement.pointAtActivation) || 0;
        
        const clientName = placement.clientName || 'Unknown Client';
        const existing = clientGroup.get(clientName) || { clientName, count: 0, pointsPerCand: basePts, totalEarned: 0 };
        existing.count += 1;
        existing.totalEarned += pts;
        clientGroup.set(clientName, existing);
      });

      const clientPointsBreakdown = Array.from(clientGroup.values()).map((cg) => ({
        clientId: cg.clientName.toLowerCase().replace(/\s+/g, '-'),
        clientName: cg.clientName,
        activeCount: cg.count,
        pointsPerCandidate: cg.pointsPerCand,
        totalEarned: cg.totalEarned,
      }));

      const totalPoints = clientPointsBreakdown.reduce((sum, item) => sum + item.totalEarned, 0);
      const activeCandidateCount = placementList.length;

      const brandIdVal = (emp as any).brandId || (emp as any).brand || undefined;
      const brandNameVal = (emp as any).brandName || undefined;

      return {
        employeeId: emp.employeeId ?? emp.employeeCode ?? emp.id ?? '',
        employeeCode: emp.employeeCode || emp.employeeId || '',
        employeeName: emp.fullName,
        department: emp.department,
        designation: emp.designation,
        brandId: brandIdVal,
        brandName: brandNameVal,
        employmentStatus: emp.employmentStatus || 'Active',
        monthlyPoints: totalPoints,
        totalPoints,
        targetPoints: 0,
        achievementPercent: 0,
        activeCandidateCount,
        clientPointsBreakdown,
        departmentRank: 1,
        companyRank: 1,
      };
    });

    // Compute Company Ranking
    summaries.sort((a, b) => b.totalPoints - a.totalPoints);
    summaries.forEach((s, idx) => {
      s.companyRank = idx + 1;
    });

    // Compute Department Ranking
    const deptGroups = new Map<string, PerformanceSummary[]>();
    summaries.forEach((s) => {
      const list = deptGroups.get(s.department) || [];
      list.push(s);
      deptGroups.set(s.department, list);
    });

    deptGroups.forEach((list) => {
      list.sort((a, b) => b.totalPoints - a.totalPoints);
      list.forEach((s, idx) => {
        s.departmentRank = idx + 1;
      });
    });

    return summaries;
  }

  async getPerformanceForEmployee(employeeId: string, month?: string): Promise<PerformanceSummary | null> {
    const all = await this.getPerformanceSummaries({ scope: 'SELF', employeeId, month });
    return all.find((s) => s.employeeId === employeeId) ?? null;
  }
}

export const performanceRepository: PerformanceRepository = new FirestorePerformanceRepository();
