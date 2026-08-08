import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import type { Client } from '../../../types/Client';
import type { Employee } from '../../Employee/types/Employee';
import type { WorkforceItem } from '../../Workbench/workforce/types/workforce';

export interface PerformanceSummary {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  monthlyPoints: number;
  totalPoints: number;
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
  rewardEligibility: string;
  promotionRecommendation: string;
  incrementRecommendation: string;
}

export interface PerformanceRepository {
  getPerformanceForEmployee(employeeId: string): Promise<PerformanceSummary | null>;
  getAllPerformanceSummaries(): Promise<PerformanceSummary[]>;
}

export class FirestorePerformanceRepository implements PerformanceRepository {
  private async fetchClientsMap(): Promise<Map<string, Client>> {
    const map = new Map<string, Client>();
    try {
      const snap = await getDocs(collection(db, 'clients'));
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        map.set(docSnap.id, { id: docSnap.id, ...data } as Client);
        if (data.name) map.set(data.name.toLowerCase(), { id: docSnap.id, ...data } as Client);
      });
    } catch {
      // Fallback
    }
    return map;
  }

  private async fetchWorkforceItems(): Promise<WorkforceItem[]> {
    try {
      const snap = await getDocs(collection(db, 'workforce'));
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as WorkforceItem));
    } catch {
      return [];
    }
  }

  private async fetchEmployees(): Promise<Employee[]> {
    try {
      const snap = await getDocs(collection(db, 'employees'));
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Employee));
    } catch {
      return [];
    }
  }

  async getAllPerformanceSummaries(): Promise<PerformanceSummary[]> {
    const [clientsMap, workforceItems, employees] = await Promise.all([
      this.fetchClientsMap(),
      this.fetchWorkforceItems(),
      this.fetchEmployees(),
    ]);

    // Group active workforce candidates by recruiterId / recruiterName
    const recruiterMap = new Map<string, WorkforceItem[]>();
    workforceItems.forEach((item) => {
      const key = item.recruiterId || item.recruiterName || item.activatedBy || 'Unassigned';
      const existing = recruiterMap.get(key) || [];
      existing.push(item);
      recruiterMap.set(key, existing);
    });

    const summaries: PerformanceSummary[] = employees.map((emp) => {
      const key = emp.employeeId || emp.employeeCode || emp.id || emp.fullName;
      const candidateList = recruiterMap.get(key) || recruiterMap.get(emp.fullName) || [];
      
      // Calculate Client-wise points using Client Master recruiter points (client.points)
      const clientGroup = new Map<string, { clientName: string; count: number; pointsPerCand: number }>();

      candidateList.forEach((cand) => {
        const clientObj = clientsMap.get(cand.clientId) || clientsMap.get(cand.clientName.toLowerCase());
        const pts = clientObj?.points ?? 10; // Consumes Client Master Recruiter Points
        const clientName = cand.clientName || clientObj?.name || 'Standard Client';

        const existing = clientGroup.get(clientName) || { clientName, count: 0, pointsPerCand: pts };
        existing.count += 1;
        clientGroup.set(clientName, existing);
      });

      const clientPointsBreakdown = Array.from(clientGroup.values()).map((cg) => ({
        clientId: cg.clientName.toLowerCase().replace(/\s+/g, '-'),
        clientName: cg.clientName,
        activeCount: cg.count,
        pointsPerCandidate: cg.pointsPerCand,
        totalEarned: cg.count * cg.pointsPerCand,
      }));

      const totalPoints = clientPointsBreakdown.reduce((sum, item) => sum + item.totalEarned, 0);
      const activeCandidateCount = candidateList.length;

      return {
        employeeId: emp.employeeId || emp.employeeCode || emp.id || 'EMP-UNKNOWN',
        employeeName: emp.fullName,
        department: emp.department,
        designation: emp.designation,
        monthlyPoints: Math.round(totalPoints * 0.4), // Current month component
        totalPoints,
        activeCandidateCount,
        clientPointsBreakdown,
        departmentRank: 1, // Will be computed after sorting
        companyRank: 1,
        rewardEligibility: totalPoints >= 200 ? 'Eligible for Quarterly Performance Bonus' : 'In Progress (Requires 200+ Points)',
        promotionRecommendation: totalPoints >= 500 ? 'Recommended for Senior Role Promotion' : 'Needs Further Client Activations',
        incrementRecommendation: totalPoints >= 300 ? 'Recommended for 15% Salary Increment' : 'Standard Annual Review',
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

  async getPerformanceForEmployee(employeeId: string): Promise<PerformanceSummary | null> {
    const all = await this.getAllPerformanceSummaries();
    return all.find((s) => s.employeeId === employeeId || s.employeeName.toLowerCase().includes(employeeId.toLowerCase())) || all[0] || null;
  }
}

export const performanceRepository: PerformanceRepository = new FirestorePerformanceRepository();
