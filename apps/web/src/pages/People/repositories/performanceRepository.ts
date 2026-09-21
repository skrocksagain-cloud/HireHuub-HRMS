import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import type { Employee } from '../../Employee/types/Employee';
import { workforceService } from '../../Workbench/workforce/v2/hooks/useWorkforceV2';

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

export interface MonthlyAggregate {
  month: string;
  totalPoints: number;
  activeCandidates: number;
}

export interface PerformanceRepository {
  getPerformanceForEmployee(employeeId: string, month?: string): Promise<PerformanceSummary | null>;
  getAllPerformanceSummaries(month?: string): Promise<PerformanceSummary[]>;
  getPerformanceSummaries(input: PerformanceScopeQuery): Promise<PerformanceSummary[]>;
  getMonthlyPerformanceAggregate(input: PerformanceScopeQuery & { brandId: string }): Promise<MonthlyAggregate[]>;
}

export interface PerformanceScopeQuery {
  scope: 'SELF' | 'DEPARTMENT' | 'GLOBAL' | 'OWN' | 'TEAM';
  employeeId?: string;
  employeeName?: string;
  employeeRole?: string;
  assignedRole?: string;
  departmentId?: string;
  month?: string;
}

function getMonthString(dateToParse: any): string | null {
  if (!dateToParse) return null;
  try {
    let timestamp = 0;
    if (typeof dateToParse === 'string') {
      if (dateToParse.includes('T')) {
        timestamp = new Date(dateToParse).getTime();
      } else {
        const parts = dateToParse.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
             timestamp = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00Z`).getTime();
          } else {
             timestamp = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`).getTime();
          }
        } else {
           timestamp = new Date(dateToParse).getTime();
        }
      }
    } else if (typeof dateToParse === 'number') {
      timestamp = dateToParse;
    } else if (dateToParse.seconds) {
      timestamp = dateToParse.seconds * 1000;
    } else if (typeof dateToParse.toDate === 'function') {
      timestamp = dateToParse.toDate().getTime();
    }
    if (!timestamp || isNaN(timestamp)) return null;
    const d = new Date(timestamp);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  } catch {
    return null;
  }
}

export class FirestorePerformanceRepository implements PerformanceRepository {
  private async fetchPlacements(input: PerformanceScopeQuery): Promise<any[]> {
    const context = {
      id: input.employeeId || 'unknown',
      name: input.employeeName || 'Unknown',
      role: input.employeeRole || 'Unknown',
      assignedRole: input.assignedRole || input.scope,
      departmentId: input.departmentId,
    };
    const activeWorkforce = await workforceService.getActiveWorkforce(context);
    return activeWorkforce.map(v2 => {
      return {
        id: v2.employeeId,
        candidateId: v2.candidate.id,
        candidateName: v2.candidate.name,
        clientId: v2.client.id,
        clientName: v2.client.name,
        recruiterId: v2.placement.recruiterId || '',
        recruiterName: v2.placement.recruiterName || '',
        rawActiveDate: v2.placement.activeDate,
        status: v2.placement.status,
      };
    });
  }

  private async fetchEmployees(input: PerformanceScopeQuery): Promise<Employee[]> {
    if (input.scope === 'SELF') {
      if (!input.employeeId?.trim()) return [];
      // input.employeeId is the Firestore document ID now! But in Employee table, is id == docId? Yes.
      // Wait, in previous fetchEmployees: where('employeeId', '==', input.employeeId)
      // Since input.employeeId is now the doc ID, querying by 'employeeId' field might fail if it stores HH0016.
      // Let's just fetch the document directly or query both. Actually if input.employeeId is doc ID:
      const snap = await getDocs(query(collection(db, 'employees')));
      const all = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) } as Employee));
      return all.filter(e => e.id === input.employeeId || e.employeeId === input.employeeId);
    }
    if (input.scope === 'DEPARTMENT') {
      if (!input.departmentId?.trim()) return [];
      const snap = await getDocs(query(collection(db, 'employees'), where('departmentId', '==', input.departmentId)));
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) } as Employee));
    }
    const snap = await getDocs(collection(db, 'employees'));
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) } as Employee));
  }

  async getMonthlyPerformanceAggregate(input: PerformanceScopeQuery & { brandId: string }): Promise<MonthlyAggregate[]> {
    const allPlacements = await this.fetchPlacements(input);

    const clientsSnap = await getDocs(collection(db, 'clients'));
    const clientPointsMap = new Map<string, number>();
    clientsSnap.forEach(d => {
      const data = d.data();
      const points = data.points ?? data.commercial?.points ?? 0;
      clientPointsMap.set(d.id, points);
      if (data.name) clientPointsMap.set(data.name, points);
    });

    const monthMap = new Map<string, { totalPoints: number, activeCandidates: number }>();

    for (const p of allPlacements) {
      const monthStr = getMonthString(p.rawActiveDate);
      if (!monthStr) continue;

      const pts = clientPointsMap.get(p.clientId) || clientPointsMap.get(p.clientName) || 0;

      const existing = monthMap.get(monthStr) || { totalPoints: 0, activeCandidates: 0 };
      existing.totalPoints += pts;
      existing.activeCandidates += 1;
      monthMap.set(monthStr, existing);
    }

    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      totalPoints: data.totalPoints,
      activeCandidates: data.activeCandidates
    }));
  }

  async getAllPerformanceSummaries(month?: string): Promise<PerformanceSummary[]> {
    return this.getPerformanceSummaries({ scope: 'GLOBAL', month });
  }

  async getPerformanceSummaries(input: PerformanceScopeQuery): Promise<PerformanceSummary[]> {
    const [allPlacements, employees] = await Promise.all([
      this.fetchPlacements(input),
      this.fetchEmployees(input)
    ]);
    let targetPlacements = allPlacements;
    if (input.month) {
      targetPlacements = allPlacements.filter((p) => {
        const placementMonthStr = getMonthString(p.rawActiveDate);
        return placementMonthStr?.toLowerCase() === input.month!.toLowerCase();
      });
    }
    const recruiterMap = new Map<string, any[]>();
    targetPlacements.forEach((placement) => {
      const key = placement.recruiterId || placement.recruiterName;
      if (!key) return;
      const existing = recruiterMap.get(key) || [];
      existing.push(placement);
      recruiterMap.set(key, existing);
    });
    const clientsSnap = await getDocs(collection(db, 'clients'));
    const clientPointsMap = new Map<string, number>();
    clientsSnap.forEach(d => {
      const data = d.data();
      const points = data.points ?? data.commercial?.points ?? 0;
      clientPointsMap.set(d.id, points);
      if (data.name) clientPointsMap.set(data.name, points);
    });
    const summaries: PerformanceSummary[] = employees.map((emp) => {
      const keys = [emp.employeeId, emp.employeeCode, emp.id, emp.fullName].filter(Boolean);
      let placementList: any[] = [];
      for (const k of keys) {
        if (k && recruiterMap.has(k)) {
          placementList = placementList.concat(recruiterMap.get(k) || []);
        }
      }
      const uniquePlacements = new Map();
      placementList.forEach(p => uniquePlacements.set(p.candidateId, p));
      placementList = Array.from(uniquePlacements.values());
      const clientGroup = new Map<string, { clientName: string; count: number; pointsPerCand: number; totalEarned: number }>();
      placementList.forEach((placement) => {
        const basePts = clientPointsMap.get(placement.clientId) || clientPointsMap.get(placement.clientName) || 0;
        const clientName = placement.clientName || 'Unknown Client';
        const existing = clientGroup.get(clientName) || { clientName, count: 0, pointsPerCand: basePts, totalEarned: 0 };
        existing.count += 1;
        existing.totalEarned += basePts;
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
    summaries.sort((a, b) => b.totalPoints - a.totalPoints);
    summaries.forEach((s, idx) => { s.companyRank = idx + 1; });
    const deptGroups = new Map<string, PerformanceSummary[]>();
    summaries.forEach((s) => {
      const list = deptGroups.get(s.department) || [];
      list.push(s);
      deptGroups.set(s.department, list);
    });
    deptGroups.forEach((list) => {
      list.sort((a, b) => b.totalPoints - a.totalPoints);
      list.forEach((s, idx) => { s.departmentRank = idx + 1; });
    });
    return summaries;
  }

  async getPerformanceForEmployee(employeeId: string, month?: string): Promise<PerformanceSummary | null> {
    const all = await this.getPerformanceSummaries({ scope: 'SELF', employeeId, month });
    return all.find((s) => s.employeeId === employeeId) ?? null;
  }
}
export const performanceRepository: PerformanceRepository = new FirestorePerformanceRepository();
