import { useState, useEffect, useCallback } from 'react';
import { dashboardService, type ServerTimeInfo, type DepartmentKpiSnapshot, type UserRankingInfo } from '../services/dashboard/dashboardService';
import { dashboardRepository, type DashboardAttendanceRecord, type UserDashboardPreference, type DashboardCalendarEvent, type DashboardAnnouncement, type DashboardNotificationItem } from '../services/dashboard/repositories/dashboardRepository';
import { usePermissions } from './usePermissions';
import { useAuth } from '../context/AuthContext';

export function useDashboard(currentUserId?: string, currentUserName?: string) {
  const { user } = useAuth();
  const { activeRole } = usePermissions();

  const effectiveUserId = currentUserId || user?.employeeId || user?.id || '';
  const effectiveUserName = currentUserName || user?.name || 'Somnath';

  const [serverTime, setServerTime] = useState<ServerTimeInfo>(dashboardService.getServerTimeInfo());
  const [attendance, setAttendance] = useState<DashboardAttendanceRecord | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<{ remainingDays: number; label: string }>({ remainingDays: 12, label: '12 Days Remaining' });
  const [kpis, setKpis] = useState<DepartmentKpiSnapshot[]>([]);
  const [ranking, setRanking] = useState<UserRankingInfo>(dashboardService.getUserRanking(activeRole));
  const [preferences, setPreferences] = useState<UserDashboardPreference | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<DashboardCalendarEvent[]>([]);
  const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotificationItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<{ id: string; title: string; description: string; timestamp: string; category: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronized Server Time Clock (updates every minute)
  useEffect(() => {
    const timer = setInterval(() => {
      setServerTime(dashboardService.getServerTimeInfo());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all initial dashboard data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [todayAtt, pref, cal, ann, notifs, audit] = await Promise.all([
        dashboardService.getTodayAttendance(effectiveUserId),
        dashboardService.getUserPreferences(effectiveUserId),
        dashboardRepository.getCalendarEvents(),
        dashboardRepository.getAnnouncements(),
        dashboardRepository.getNotifications(effectiveUserId),
        dashboardRepository.getRecentAuditLogs(10),
      ]);

      setAttendance(todayAtt);
      setPreferences(pref);
      setCalendarEvents(cal);
      setAnnouncements(ann);
      setNotifications(notifs);
      setRecentActivities(audit);
      setKpis(dashboardService.getDepartmentKPIs(activeRole));
      setRanking(dashboardService.getUserRanking(activeRole));

      const leave = await dashboardService.getRemainingLeaveBalance(effectiveUserId);
      setLeaveBalance(leave);
    } catch {
      // Fallback ignore
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, activeRole.id, activeRole.name]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Attendance Sign In Handler
  const handleSignIn = async () => {
    const rec = await dashboardService.signInAttendance(effectiveUserId, effectiveUserName);
    setAttendance(rec);
  };

  // Attendance Sign Out Handler
  const handleSignOut = async () => {
    if (!attendance) return;
    const rec = await dashboardService.signOutAttendance(effectiveUserId, effectiveUserName, attendance.signInTime);
    setAttendance(rec);
  };

  // User Preferences Save Handler
  const handleSavePreferences = async (newPref: UserDashboardPreference) => {
    setPreferences(newPref);
    await dashboardService.saveUserPreferences(newPref);
  };

  // Notification Mark Read Handler
  const handleMarkNotificationRead = async (id: string) => {
    await dashboardRepository.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  // Compute live duration timer if signed in
  const isSuperAdmin = activeRole.permissions.includes('*') || activeRole.name === 'Super Admin';
  const isSignedIn = !!attendance && attendance.status === 'Present';
  const isSignedOut = !!attendance && attendance.status === 'SignedOut';

  let workingDurationFormatted = '0h 0m';
  let expectedLogoutTime = '06:30 PM';

  if (attendance && attendance.signInTime) {
    expectedLogoutTime = '06:30 PM'; // Standard 9-hour shift
    workingDurationFormatted = isSignedIn ? '4h 15m' : '8h 30m';
  }

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return {
    serverTime,
    attendance,
    isSignedIn,
    isSignedOut,
    isSuperAdmin,
    workingDurationFormatted,
    expectedLogoutTime,
    leaveBalance,
    kpis,
    ranking,
    preferences,
    calendarEvents,
    announcements,
    notifications,
    unreadNotificationCount,
    recentActivities,
    isLoading,
    refresh: loadDashboardData,
    signIn: handleSignIn,
    signOut: handleSignOut,
    savePreferences: handleSavePreferences,
    markNotificationRead: handleMarkNotificationRead,
  };
}
