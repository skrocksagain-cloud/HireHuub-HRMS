import { collection, getDocs, query, where  } from 'firebase/firestore';
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
  department?: string;
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
    private async getAuthorizedIds(input: PerformanceScopeQuery): Promise<string[] | null> {
    const scope = input.scope;
    let authorizedIds: string[] | null = null;
    if (scope === 'GLOBAL') {
      return null;
    } else if (scope === 'DEPARTMENT') {
      const empsSnap = await getDocs(query(collection(db, 'employees'), where('departmentId', '==', input.departmentId)));
      authorizedIds = empsSnap.docs.flatMap(d => [d.id, d.data().employeeId].filter(Boolean) as string[]);
    } else if (scope === 'TEAM') {
      const empsSnap = await getDocs(query(collection(db, 'employees'), where('reportingManagerId', '==', input.employeeId)));
      authorizedIds = empsSnap.docs.flatMap(d => [d.id, d.data().employeeId].filter(Boolean) as string[]);
      if (input.employeeId) authorizedIds.push(input.employeeId);
    } else {
      authorizedIds = [input.employeeId || ''];
    }
    return authorizedIds;
  }

  private async fetchCrmCandidates(authorizedIds: string[] | null): Promise<any[]> {
    const allResults: any[] = [];
    if (authorizedIds === null) {
      const snap = await getDocs(query(collection(db, 'crm_candidates')));
      snap.forEach(d => allResults.push({ id: d.id, ...d.data() }));
    } else {
      const chunks = [];
      for (let i = 0; i < authorizedIds.length; i += 30) {
        chunks.push(authorizedIds.slice(i, i + 30));
      }
      for (const chunk of chunks) {
        if (chunk.length === 0) continue;
        const snap = await getDocs(query(collection(db, 'crm_candidates'), where('assignedRecruiterId', 'in', chunk)));
        snap.forEach(d => allResults.push({ id: d.id, ...d.data() }));
      }
    }
    return allResults;
  }

  private async fetchEmployees(input: PerformanceScopeQuery): Promise<Employee[]> {
    if (input.scope === 'SELF') {
      if (!input.employeeId?.trim()) return [];
      const snap = await getDocs(query(collection(db, 'employees')));
      const all = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) } as Employee));
      return all.filter(e => e.id === input.employeeId || e.employeeId === input.employeeId);
    }
    if (input.scope === 'TEAM') {
      if (!input.employeeId?.trim()) return [];
      const snap = await getDocs(query(collection(db, 'employees'), where('reportingManagerId', '==', input.employeeId)));
      const reports = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) } as Employee));

      const allSnap = await getDocs(query(collection(db, 'employees')));
      const all = allSnap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) } as Employee));
      const self = all.filter(e => e.id === input.employeeId || e.employeeId === input.employeeId);

      const combined = [...reports, ...self];
      const unique = new Map();
      combined.forEach(e => unique.set(e.id, e));
      return Array.from(unique.values());
    }
    if (input.scope === 'DEPARTMENT') {
      if (!input.departmentId?.trim() && !input.department?.trim()) return [];
      let snap;
      if (input.departmentId?.trim()) {
        snap = await getDocs(query(collection(db, 'employees'), where('departmentId', '==', input.departmentId)));
      } else {
        snap = await getDocs(query(collection(db, 'employees'), where('department', '==', input.department)));
      }
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) } as Employee));
    }
    const snap = await getDocs(collection(db, 'employees'));
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as object) } as Employee));
  }

  
  private async getCandidateLatestActiveDates(crmCandidates: any[]): Promise<Map<string, string>> {
    const latestDates = new Map<string, string>();
    const chunkSize = 20; // prevent too many concurrent requests
    for (let i = 0; i < crmCandidates.length; i += chunkSize) {
      const chunk = crmCandidates.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (c) => {
        try {
          const snap = await getDocs(query(collection(db, 'crm_candidates', c.id, 'statusHistory'), where('newStatus', '==', 'Active')));
          let latestTimestamp = '';
          snap.forEach(d => {
            const data = d.data();
            const ts = data.timestamp; // The CRM event timestamp is 'timestamp' based on our previous audit of crmRepository.ts
            if (!latestTimestamp || new Date(ts) > new Date(latestTimestamp)) {
              latestTimestamp = ts;
            }
          });
          if (latestTimestamp) {
            latestDates.set(c.id, latestTimestamp);
          }
        } catch (err) {
           console.error('Error fetching statusHistory for', c.id, err);
        }
      }));
    }
    return latestDates;
  }

  private async getClientPointsMap(): Promise<Map<string, number>> {
    const clientPoints = new Map<string, number>();
    const snap = await getDocs(collection(db, 'clients'));
    snap.forEach(d => {
      const data = d.data();
      // Current CRM client ID fallback can be checked, we'll store by doc ID and clientId
      const pts = typeof data.points === 'number' ? data.points : 0;
      clientPoints.set(d.id, pts);
      if (data.clientId) {
        clientPoints.set(data.clientId, pts);
      }
    });
    return clientPoints;
  }

  async getMonthlyPerformanceAggregate(input: PerformanceScopeQuery & { brandId: string }): Promise<MonthlyAggregate[]> {
    const authorizedIds = await this.getAuthorizedIds(input);
    const crmCandidates = await this.fetchCrmCandidates(authorizedIds);
    const [latestDatesMap, clientPointsMap] = await Promise.all([
      this.getCandidateLatestActiveDates(crmCandidates),
      this.getClientPointsMap()
    ]);

    const monthMap = new Map<string, { totalPoints: number, activeCandidates: number }>();

    for (const c of crmCandidates) {
      const latestActive = latestDatesMap.get(c.id);
      if (!latestActive) continue;

      const monthStr = getMonthString(latestActive);
      if (!monthStr) continue;

      const clientId = c.currentClientId;
      const pts = clientId && clientPointsMap.has(clientId) ? (clientPointsMap.get(clientId) || 0) : 0;

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
    const authorizedIds = await this.getAuthorizedIds(input);
    const [employees, crmCandidates, clientPointsMap] = await Promise.all([
      this.fetchEmployees(input),
      this.fetchCrmCandidates(authorizedIds),
      this.getClientPointsMap()
    ]);
    const latestDatesMap = await this.getCandidateLatestActiveDates(crmCandidates);

    // Build map of qualifying candidates per recruiter
    const recruiterMap = new Map<string, any[]>();

    for (const c of crmCandidates) {
      const latestActive = latestDatesMap.get(c.id);
      if (!latestActive) continue;
      
      const candidateMonthStr = getMonthString(latestActive);
      if (!candidateMonthStr) continue;

      // Filter by selected month
      if (input.month && candidateMonthStr.toLowerCase() !== input.month.toLowerCase()) {
        continue;
      }

      const recId = c.assignedRecruiterId;
      if (!recId) continue;

      const existing = recruiterMap.get(recId) || [];
      existing.push({
        candidate: c,
        points: (c.currentClientId && clientPointsMap.has(c.currentClientId)) ? (clientPointsMap.get(c.currentClientId) || 0) : 0
      });
      recruiterMap.set(recId, existing);
    }

    const summaries: PerformanceSummary[] = employees.map((emp) => {
      const keys = [emp.employeeId, emp.employeeCode, emp.id, emp.fullName].filter(Boolean);
      let qualifyingCandidates: any[] = [];
      const seenCandidateIds = new Set<string>();

      for (const k of keys) {
        if (k && recruiterMap.has(k)) {
          const list = recruiterMap.get(k) || [];
          for (const item of list) {
            if (!seenCandidateIds.has(item.candidate.id)) {
              seenCandidateIds.add(item.candidate.id);
              qualifyingCandidates.push(item);
            }
          }
        }
      }

      let totalPoints = 0;
      let activeCandidateCount = qualifyingCandidates.length;

      const clientGroup = new Map<string, { clientName: string; count: number; pointsPerCand: number; totalEarned: number }>();
      
      qualifyingCandidates.forEach((item) => {
        const c = item.candidate;
        const pts = item.points;
        const clientName = c.currentClientName || 'Unknown Client';
        totalPoints += pts;

        const existing = clientGroup.get(clientName) || { clientName, count: 0, pointsPerCand: pts, totalEarned: 0 };
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
    const summaries = await this.getPerformanceSummaries({ scope: 'SELF', employeeId, month });
    return summaries.length > 0 ? summaries[0] : null;
  }
}

export const performanceRepository: PerformanceRepository = new FirestorePerformanceRepository();
