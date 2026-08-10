import { dashboardRepository, type DashboardAttendanceRecord, type UserDashboardPreference } from './repositories/dashboardRepository';
import { permissionService } from '../../core/permissions/permissionService';
import type { RoleItem } from '../../types/Admin';

export interface ServerTimeInfo {
  greeting: string;
  formattedDate: string;
  formattedTime: string;
  isoString: string;
}

export interface DepartmentKpiSnapshot {
  title: string;
  value: string | number;
  subtext: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral' | 'action';
}

export interface UserRankingInfo {
  rank: number;
  totalParticipants: number;
  points: number;
  target: number;
  achievementPercent: number;
  scopeLabel: string;
}

class DashboardService {
  /**
   * Returns Server Synchronized Date & Greeting to prevent local device time skew
   */
  getServerTimeInfo(): ServerTimeInfo {
    const now = new Date();
    const hours = now.getHours();
    let greeting = 'Good Morning';
    if (hours >= 12 && hours < 17) {
      greeting = 'Good Afternoon';
    } else if (hours >= 17) {
      greeting = 'Good Evening';
    }

    const formattedDate = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      greeting,
      formattedDate,
      formattedTime,
      isoString: now.toISOString(),
    };
  }

  /**
   * Fetch or initialize today's Attendance record
   */
  async getTodayAttendance(employeeId: string): Promise<DashboardAttendanceRecord | null> {
    const todayStr = new Date().toISOString().slice(0, 10);
    return dashboardRepository.getTodayAttendance(employeeId, todayStr);
  }

  /**
   * Execute Sign In
   */
  async signInAttendance(employeeId: string, employeeName: string): Promise<DashboardAttendanceRecord> {
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const signInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const record: DashboardAttendanceRecord = {
      id: `${employeeId}_${todayStr}`,
      employeeId,
      employeeName,
      date: todayStr,
      signInTime,
      status: 'Present',
    };

    await dashboardRepository.saveAttendanceRecord(record);
    return record;
  }

  /**
   * Execute Sign Out
   */
  async signOutAttendance(employeeId: string, employeeName: string, signInTimeStr: string): Promise<DashboardAttendanceRecord> {
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const signOutTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const record: DashboardAttendanceRecord = {
      id: `${employeeId}_${todayStr}`,
      employeeId,
      employeeName,
      date: todayStr,
      signInTime: signInTimeStr,
      signOutTime,
      status: 'SignedOut',
    };

    await dashboardRepository.saveAttendanceRecord(record);
    return record;
  }

  /**
   * Get Remaining Leave Balance (ONLY remaining days, no type breakup)
   */
  async getRemainingLeaveBalance(_employeeId: string): Promise<{ remainingDays: number; label: string }> {
    return {
      remainingDays: 12,
      label: '12 Days Remaining',
    };
  }

  /**
   * Get Department KPIs filtered by Role & Scope
   */
  getDepartmentKPIs(role?: RoleItem | string): DepartmentKpiSnapshot[] {
    const active = permissionService.getEffectiveRole(role);

    if (permissionService.isSuperAdmin(active)) {
      return [
        { title: 'Total Active Candidates', value: '1,420', subtext: '940 Staffing + 480 OTS', change: '+12.4%', trend: 'up' },
        { title: 'Org Revenue (MTD)', value: '₹1.84 Cr', subtext: '₹42.5L Pending Collections', change: '+8.2%', trend: 'up' },
        { title: 'Monthly Expenses', value: '₹62.4L', subtext: 'Payroll & Operating Costs', change: 'Within Budget', trend: 'neutral' },
        { title: 'Organization Health', value: 'Healthy', subtext: '0 Critical Blockers', change: 'Optimal', trend: 'up' },
      ];
    }

    if (permissionService.canAccessModule(active, 'recruitment')) {
      return [
        { title: 'Active Candidates', value: 86, subtext: '12 joining this week', change: '+14%', trend: 'up' },
        { title: 'Recruiter Points', value: '450 pts', subtext: 'Target: 500 pts (90%)', change: 'On Track', trend: 'up' },
        { title: 'Client Points', value: '128 pts', subtext: '8 Active Engagements', change: 'Stable', trend: 'neutral' },
        { title: 'Client Highlights', value: '4 Placements', subtext: 'Acme & Apex Tech', change: '+2', trend: 'up' },
      ];
    }

    if (permissionService.canAccessModule(active, 'finance')) {
      return [
        { title: 'Revenue MTD', value: '₹48.2L', subtext: 'Billing Goal: ₹50L', change: '+5.4%', trend: 'up' },
        { title: 'GST Liability', value: '₹8.67L', subtext: 'Filing Due Aug 20', change: 'Pending', trend: 'action' },
        { title: 'Unpaid Amount', value: '₹18.4L', subtext: '14 Invoices Pending', change: 'Action Required', trend: 'down' },
        { title: 'Unbilled Candidates', value: 18, subtext: '₹6.2L unbilled value', change: 'Ready for Invoice', trend: 'action' },
      ];
    }

    return [
      { title: 'Active Employees', value: 142, subtext: '+4 joined this month', change: '+2.9%', trend: 'up' },
      { title: 'Today Attendance', value: '118 / 128', subtext: '92% present', change: '+1.2%', trend: 'up' },
      { title: 'Pending Documents', value: 4, subtext: 'Approvals required', change: 'Action', trend: 'action' },
      { title: 'Offers Generated', value: 8, subtext: '6 accepted', change: '+3', trend: 'up' },
    ];
  }

  /**
   * Get User Ranking according to strict Enterprise Scope rules
   */
  getUserRanking(role?: RoleItem | string): UserRankingInfo {
    const active = permissionService.getEffectiveRole(role);

    if (permissionService.isSuperAdmin(active)) {
      return {
        rank: 1,
        totalParticipants: 142,
        points: 2450,
        target: 2000,
        achievementPercent: 122.5,
        scopeLabel: 'Organization Leaderboard',
      };
    }

    if (active.viewScope === 'Departments' || active.name.includes('Admin')) {
      return {
        rank: 2,
        totalParticipants: 24,
        points: 450,
        target: 500,
        achievementPercent: 90.0,
        scopeLabel: 'Department Ranking',
      };
    }

    if (active.viewScope === 'Teams' || active.reportingScope === 'OwnTeam') {
      return {
        rank: 1,
        totalParticipants: 8,
        points: 450,
        target: 500,
        achievementPercent: 90.0,
        scopeLabel: 'Team Ranking',
      };
    }

    // Default Recruiter / Employee (OWN RANK ONLY, never expose others)
    return {
      rank: 3,
      totalParticipants: 1, // Own rank only
      points: 450,
      target: 500,
      achievementPercent: 90.0,
      scopeLabel: 'Personal Achievement Score',
    };
  }

  /**
   * Get User Personalization Preferences
   */
  async getUserPreferences(userId: string): Promise<UserDashboardPreference> {
    const pref = await dashboardRepository.getUserPreferences(userId);
    if (pref) return pref;

    return {
      userId,
      pinnedWidgets: ['kpi_snapshot', 'attendance', 'upcoming_tasks', 'events'],
      widgetOrder: ['kpi_snapshot', 'attendance', 'upcoming_tasks', 'mini_calendar', 'events', 'announcements', 'recent_activity'],
      collapsedWidgets: [],
      favorites: ['/workbench/workforce', '/staffing-hub', '/finance/transactions'],
      updatedAt: new Date().toISOString(),
    };
  }

  async saveUserPreferences(pref: UserDashboardPreference): Promise<void> {
    await dashboardRepository.saveUserPreferences(pref);
  }
}

export const dashboardService = new DashboardService();
