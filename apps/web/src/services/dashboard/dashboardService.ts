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
  topPerformerName?: string;
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
    const { attendanceRepository } = await import('../../pages/Attendance/repositories/attendanceRepository');
    const canonical = await attendanceRepository.getDaily(employeeId, todayStr);

    if (!canonical) {
      return null;
    }

    return {
      id: canonical.id,
      employeeId: canonical.employeeId,
      employeeName: canonical.employeeName,
      date: canonical.attendanceDate,
      signInTime: canonical.loginTime ? canonical.loginTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      signOutTime: canonical.logoutTime ? canonical.logoutTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      status: canonical.logoutTime ? 'SignedOut' : (canonical.status === 'Half Day' ? 'HalfDay' : (canonical.status === 'Late' ? 'Late' : 'Present')),
      totalDurationMinutes: canonical.totalWorkMinutes,
    };
  }

  /**
   * Execute Sign In
   */
  async signInAttendance(employeeId: string, employeeName: string): Promise<DashboardAttendanceRecord> {
    const { employeeService } = await import('../../pages/Employee/services/employeeService');
    const { attendanceService } = await import('../../pages/Attendance/services/attendanceService');

    const employee = await employeeService.getEmployeeById(employeeId);

    await attendanceService.login({
      employeeId,
      name: employeeName,
      role: employee?.designation || 'User',
      department: employee?.department || 'General'
    }, {
      deviceType: 'Desktop',
      latitude: null,
      longitude: null,
      address: 'Dashboard'
    });

    const record = await this.getTodayAttendance(employeeId);
    if (!record) {
      throw new Error('Failed to retrieve canonical attendance record after sign in.');
    }
    return record;
  }

  /**
   * Execute Sign Out
   */
  async signOutAttendance(employeeId: string, employeeName: string, _signInTimeStr: string): Promise<DashboardAttendanceRecord> {
    const { employeeService } = await import('../../pages/Employee/services/employeeService');
    const { attendanceService } = await import('../../pages/Attendance/services/attendanceService');

    const employee = await employeeService.getEmployeeById(employeeId);

    await attendanceService.logout({
      employeeId,
      name: employeeName,
      role: employee?.designation || 'User',
      department: employee?.department || 'General'
    });

    const record = await this.getTodayAttendance(employeeId);
    if (!record) {
      throw new Error('Failed to retrieve canonical attendance record after sign out.');
    }
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
  async getDepartmentKPIs(role?: string, effectiveUserId?: string, departmentId?: string): Promise<DepartmentKpiSnapshot[]> {
    const roleName = role || 'User';

    const { getDocs, query, collection, where } = await import('firebase/firestore');
    const { db } = await import('../../firebase/firebase');
    const { workforceService } = await import('../../pages/Workbench/workforce/v2/hooks/useWorkforceV2');
    const { performanceRepository } = await import('../../pages/People/repositories/performanceRepository');
    
    // Default context for API queries that need full objects
    const mockContext = {
      id: effectiveUserId || '',
      name: roleName,
      role: roleName,
      assignedRole: roleName,
      departmentId: departmentId
    };
    
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Helpers to fetch data
    async function getActiveWorkforce() {
      const records = await workforceService.getActiveWorkforce(mockContext as any, { month: currentMonth }).catch(() => []);
      return records.length;
    }

    async function getPoints(scope: 'OWN' | 'DEPARTMENT' | 'GLOBAL') {
      try {
        const summaries = await performanceRepository.getPerformanceSummaries({ scope, month: currentMonth, employeeId: effectiveUserId });
        let total = 0;
        let calls = 0;
        summaries.forEach(s => {
          total += (s.totalPoints || 0);
          const sm = s as any; if (sm.metrics && sm.metrics['Calls']) {
             calls += (sm.metrics['Calls'].achieved || 0);
          }
        });
        return { total, calls };
      } catch {
        return { total: 0, calls: 0 };
      }
    }
    
    async function getExpensesAndReceived() {
      let expenses = 0;
      let received = 0;
      try {
        const prSnap = await getDocs(query(collection(db, 'payrollRuns'), where('month', '==', currentMonth)));
        prSnap.forEach((d: any) => { expenses += (d.data().totalEmployerCost || 0); });
        
        const txSnap = await getDocs(query(collection(db, 'finance_transactions'), where('type', '==', 'Received')));
        txSnap.forEach((d: any) => { 
          const date = d.data().date || '';
          if (date.startsWith(currentMonth)) {
             received += (d.data().amount || 0); 
          }
        });
      } catch {
        // Ignore
      }
      return { expenses, received };
    }

    if (roleName === 'Super Admin' || roleName === 'Master Admin') {
      const wf = await getActiveWorkforce();
      const pts = await getPoints('GLOBAL');
      const fin = await getExpensesAndReceived();

      return [
        { title: 'Total Active Workforce', value: wf, subtext: 'Organization wide', change: '0%', trend: 'neutral' },
        { title: 'Total Points', value: pts.total, subtext: 'MTD', change: '0%', trend: 'neutral' },
        { title: 'Total Expense', value: `₹${fin.expenses.toLocaleString('en-IN')}`, subtext: 'MTD', change: '0%', trend: 'neutral' },
        { title: 'Total Received Amount', value: `₹${fin.received.toLocaleString('en-IN')}`, subtext: 'MTD', change: '0%', trend: 'neutral' },
      ];
    }

    if (roleName === 'Admin') {
      const wf = await getActiveWorkforce();
      const pts = await getPoints('DEPARTMENT');

      return [
        { title: 'Staffing Calls', value: pts.calls, subtext: 'MTD', change: '0%', trend: 'neutral' },
        { title: 'Staffing Active Workforce', value: wf, subtext: 'Currently deployed', change: '0%', trend: 'neutral' },
        { title: 'Staffing Points', value: pts.total, subtext: 'MTD', change: '0%', trend: 'neutral' },
      ];
    }

    // Default User
    const wf = await getActiveWorkforce();
    const pts = await getPoints('OWN');

    return [
      { title: 'My Calls', value: pts.calls, subtext: 'MTD', change: '0%', trend: 'neutral' },
      { title: 'My Active Workforce', value: wf, subtext: 'Currently deployed', change: '0%', trend: 'neutral' },
      { title: 'My Points', value: pts.total, subtext: 'MTD', change: '0%', trend: 'neutral' },
    ];
  }

  /**
   * Get User Ranking according to strict Enterprise Scope rules
   */
  async getUserRanking(role?: string): Promise<UserRankingInfo> {
    const roleName = role || 'User';

    if (roleName === 'Super Admin') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      let topName = '';
      try {
        const { performanceRepository } = await import('../../pages/People/repositories/performanceRepository');
        const summaries = await performanceRepository.getPerformanceSummaries({ scope: 'GLOBAL', month: currentMonth });
        if (summaries && summaries.length > 0) {
          const sorted = summaries.sort((a, b) => b.totalPoints - a.totalPoints);
          if (sorted[0].totalPoints > 0) {
            topName = sorted[0].employeeName;
          }
        }
      } catch (err) {
        // ignore
      }

      return {
        rank: 1, // Organization Leaderboard displays the Top 1 by default
        totalParticipants: 0,
        points: 0,
        target: 0,
        achievementPercent: 0,
        scopeLabel: 'Organization Leaderboard',
        topPerformerName: topName
      };
    }

    if (roleName === 'Master Admin') {
      return {
        rank: 0,
        totalParticipants: 0,
        points: 0,
        target: 0,
        achievementPercent: 0,
        scopeLabel: 'Department Ranking',
      };
    }

    if (roleName === 'Admin') {
      return {
        rank: 0,
        totalParticipants: 0,
        points: 0,
        target: 0,
        achievementPercent: 0,
        scopeLabel: 'Team Ranking',
      };
    }

    // Default User (OWN RANK ONLY, never expose others)
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
      const { getLocalAttendanceDate } = await import('../../pages/Attendance/utils/attendance');
      const todayStr = getLocalAttendanceDate();
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

      // Present: Attendance status = Present / Late / Half Day / WFH today
      const presentRecords = attendanceList.filter(
        (a: { status?: string, employeeId: string }) => a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day' || a.status === 'WFH'
      );
      const present = new Set(presentRecords.map((a: { employeeId: string }) => a.employeeId)).size;

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
