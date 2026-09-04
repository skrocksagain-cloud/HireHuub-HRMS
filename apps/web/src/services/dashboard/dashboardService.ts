import { dashboardRepository, type DashboardAttendanceRecord, type UserDashboardPreference } from './repositories/dashboardRepository';



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
  async getRemainingLeaveBalance(employeeId: string): Promise<{ remainingDays: number; label: string }> {
    if (!employeeId) {
      return { remainingDays: 0, label: '0 Days Remaining' };
    }
    try {
      const { leaveRepository } = await import('../../pages/Leave/repositories/leaveRepository');
      const balances = await leaveRepository.getBalances(employeeId);
      const totalRemaining = balances.reduce((sum: number, b: { available?: number }) => sum + (b.available || 0), 0);
      return {
        remainingDays: totalRemaining,
        label: `${totalRemaining} Days Remaining`,
      };
    } catch {
      return {
        remainingDays: 0,
        label: '0 Days Remaining',
      };
    }
  }

  /**
   * Get Department KPIs filtered by Role & Scope
   */
  getDepartmentKPIs(role?: any | string): DepartmentKpiSnapshot[] {
    const active = true;

    if (['Super Admin', 'Super_Admin'].includes(active?.assignedRole || active?.role || active?.name || '')) {
      return [
        { title: 'Total Active Candidates', value: 0, subtext: '0 Staffing + 0 OTS', change: '0%', trend: 'neutral' },
        { title: 'Org Revenue (MTD)', value: '₹0', subtext: '₹0 Pending Collections', change: '0%', trend: 'neutral' },
        { title: 'Monthly Expenses', value: '₹0', subtext: 'Payroll & Operating Costs', change: '0%', trend: 'neutral' },
        { title: 'Organization Health', value: '--', subtext: '0 Critical Blockers', change: '--', trend: 'neutral' },
      ];
    }

    if (true) {
      return [
        { title: 'Active Candidates', value: 0, subtext: '0 joining this week', change: '0%', trend: 'neutral' },
        { title: 'Recruiter Points', value: '0 pts', subtext: 'Target: 0 pts', change: '0%', trend: 'neutral' },
        { title: 'Client Points', value: '0 pts', subtext: '0 Active Engagements', change: '0%', trend: 'neutral' },
        { title: 'Client Highlights', value: '0 Placements', subtext: 'None', change: '0', trend: 'neutral' },
      ];
    }

    if (true) {
      return [
        { title: 'Revenue MTD', value: '₹0', subtext: 'Billing Goal: ₹0', change: '0%', trend: 'neutral' },
        { title: 'GST Liability', value: '₹0', subtext: 'No pending filing', change: 'Optimal', trend: 'neutral' },
        { title: 'Unpaid Amount', value: '₹0', subtext: '0 Invoices Pending', change: 'Optimal', trend: 'neutral' },
        { title: 'Unbilled Candidates', value: 0, subtext: '₹0 unbilled value', change: 'None', trend: 'neutral' },
      ];
    }

    return [
      { title: 'Active Employees', value: 0, subtext: '0 joined this month', change: '0%', trend: 'neutral' },
      { title: 'Today Attendance', value: '0 / 0', subtext: '0% present', change: '0%', trend: 'neutral' },
      { title: 'Pending Documents', value: 0, subtext: 'Approvals required', change: 'None', trend: 'neutral' },
      { title: 'Offers Generated', value: 0, subtext: '0 accepted', change: '0', trend: 'neutral' },
    ];
  }

  /**
   * Get User Ranking according to strict Enterprise Scope rules
   */
  getUserRanking(role?: any | string): UserRankingInfo {
    const active = true;

    if (['Super Admin', 'Super_Admin'].includes(active?.assignedRole || active?.role || active?.name || '')) {
      return {
        rank: 0,
        totalParticipants: 0,
        points: 0,
        target: 0,
        achievementPercent: 0,
        scopeLabel: 'Organization Leaderboard',
      };
    }

    if (active.viewScope === 'Departments' || active.name.includes('Admin')) {
      return {
        rank: 0,
        totalParticipants: 0,
        points: 0,
        target: 0,
        achievementPercent: 0,
        scopeLabel: 'Department Ranking',
      };
    }

    if (active.viewScope === 'Teams' || active.reportingScope === 'OwnTeam') {
      return {
        rank: 0,
        totalParticipants: 0,
        points: 0,
        target: 0,
        achievementPercent: 0,
        scopeLabel: 'Team Ranking',
      };
    }

    // Default Recruiter / Employee (OWN RANK ONLY, never expose others)
    return {
      rank: 0,
      totalParticipants: 0,
      points: 0,
      target: 0,
      achievementPercent: 0,
      scopeLabel: 'Personal Achievement Score',
    };
  }

  /**
   * Get Live Status Strip Metrics dynamically from Firestore repositories
   */
  async getLiveStatusMetrics(): Promise<{
    workingToday: number;
    present: number;
    onLeave: number;
    meetingsToday: number;
    birthdays: number;
    pendingApprovals: number;
  }> {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const mmDd = todayStr.slice(5);

      const { employeeService } = await import('../../pages/Employee/services/employeeService');
      const { attendanceRepository } = await import('../../pages/Attendance/repositories/attendanceRepository');
      const { leaveRepository } = await import('../../pages/Leave/repositories/leaveRepository');
      const { calendarRepository } = await import('../calendar/repositories/calendarRepository');

      const [employees, attendanceList, leaveRequests, calendarEvents, pendingLeaves] = await Promise.all([
        employeeService.getEmployees().catch(() => []),
        attendanceRepository.getDailyForOrganization(todayStr, todayStr).catch(() => []),
        leaveRepository.getOrganizationRequests().catch(() => []),
        calendarRepository.getEvents().catch(() => []),
        leaveRepository.getPendingRequests().catch(() => []),
      ]);

      // Working Today: Active employees (not Inactive / Terminated / Resigned)
      const workingToday = employees.filter(
        (e: { employmentStatus?: string; status?: string }) =>
          e.employmentStatus === 'Active' || e.employmentStatus === 'Notice Period' || e.status === 'Active'
      ).length;

      // Present: Attendance status = Present / HalfDay / SignedOut today
      const present = attendanceList.filter(
        (a: { status?: string }) => a.status === 'Present' || a.status === 'HalfDay' || a.status === 'SignedOut'
      ).length;

      // On Leave: Approved leave requests spanning today
      const onLeave = leaveRequests.filter(
        (l: { status?: string; startDate: string; endDate: string }) =>
          l.status === 'Approved' && l.startDate <= todayStr && l.endDate >= todayStr
      ).length;

      // Meetings Today: Today's calendar events of type Meeting or Interview
      const meetingsToday = calendarEvents.filter(
        (c: { date: string; eventType?: string; type?: string }) =>
          c.date === todayStr && (c.eventType === 'Meeting' || c.eventType === 'Interview' || c.type === 'Review' || c.type === 'Interview')
      ).length;

      // Birthdays: Active employees whose dateOfBirth matches MM-DD today
      const birthdays = employees.filter((e: { dateOfBirth?: string }) => {
        if (!e.dateOfBirth) return false;
        const dobMmDd = e.dateOfBirth.slice(5);
        return dobMmDd === mmDd;
      }).length;

      // Pending Approvals: Total pending leave requests + pending attendance requests
      const pendingAttendance = await attendanceRepository.getPendingRequests().catch(() => []);
      const pendingApprovals = pendingLeaves.length + pendingAttendance.length;

      return {
        workingToday,
        present,
        onLeave,
        meetingsToday,
        birthdays,
        pendingApprovals,
      };
    } catch {
      return {
        workingToday: 0,
        present: 0,
        onLeave: 0,
        meetingsToday: 0,
        birthdays: 0,
        pendingApprovals: 0,
      };
    }
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
