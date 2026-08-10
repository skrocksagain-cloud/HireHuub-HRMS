import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';

export interface UserDashboardPreference {
  userId: string;
  pinnedWidgets: string[];
  widgetOrder: string[];
  collapsedWidgets: string[];
  favorites: string[];
  updatedAt: string;
}

export interface DashboardAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  signInTime: string; // HH:mm AM/PM
  signOutTime?: string;
  status: 'Present' | 'Late' | 'HalfDay' | 'SignedOut';
  totalDurationMinutes?: number;
}

export interface DashboardCalendarEvent {
  id: string;
  title: string;
  type: 'Planning' | 'Review' | 'Discussion' | 'Training' | 'Client Visit' | 'Interview' | 'Team Meet' | 'Holiday' | 'Reminder';
  startTime: string;
  endTime: string;
  date: string;
  location?: string;
  meetingLink?: string;
  visibility: 'Personal' | 'Team' | 'Department' | 'Organization';
  departmentId?: string;
  organizerId: string;
  organizerName: string;
}

export interface DashboardAnnouncement {
  id: string;
  title: string;
  summary: string;
  category: string;
  pdfUrl?: string;
  pdfFileName?: string;
  targetScope: 'Organization' | 'Department' | 'Team' | 'Employee';
  targetDepartmentId?: string;
  publishedAt: string;
  isImportant?: boolean;
}

export interface DashboardNotificationItem {
  id: string;
  userId?: string;
  category: 'Approval' | 'Meeting' | 'Birthday' | 'Announcement' | 'Invoice' | 'Offer' | 'Leave' | 'Calendar';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

class DashboardRepository {
  /**
   * Fetch User Preferences for Dashboard Layout Personalization
   */
  async getUserPreferences(userId: string): Promise<UserDashboardPreference | null> {
    try {
      const docRef = doc(db, 'user_dashboard_preferences', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserDashboardPreference;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Save / Update User Dashboard Personalization Preferences
   */
  async saveUserPreferences(pref: UserDashboardPreference): Promise<void> {
    const docRef = doc(db, 'user_dashboard_preferences', pref.userId);
    await setDoc(docRef, { ...pref, updatedAt: new Date().toISOString() });
  }

  /**
   * Fetch Today's Attendance Record for Employee
   */
  async getTodayAttendance(employeeId: string, todayDateStr: string): Promise<DashboardAttendanceRecord | null> {
    try {
      const docRef = doc(db, 'attendance_logs', `${employeeId}_${todayDateStr}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as DashboardAttendanceRecord;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Record Attendance Sign In / Sign Out
   */
  async saveAttendanceRecord(record: DashboardAttendanceRecord): Promise<void> {
    const docRef = doc(db, 'attendance_logs', `${record.employeeId}_${record.date}`);
    await setDoc(docRef, record, { merge: true });
  }

  /**
   * Fetch Calendar Events
   */
  async getCalendarEvents(): Promise<DashboardCalendarEvent[]> {
    try {
      const snap = await getDocs(collection(db, 'admin_calendar_events'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DashboardCalendarEvent, 'id'>) }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch Announcements
   */
  async getAnnouncements(): Promise<DashboardAnnouncement[]> {
    try {
      const snap = await getDocs(collection(db, 'admin_announcements'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DashboardAnnouncement, 'id'>) }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch Notifications
   */
  async getNotifications(userId: string): Promise<DashboardNotificationItem[]> {
    try {
      const snap = await getDocs(collection(db, 'admin_notifications'));
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<DashboardNotificationItem, 'id'>) }))
        .filter((n) => !n.userId || n.userId === userId);
    } catch {
      return [];
    }
  }

  /**
   * Mark Notification Read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'admin_notifications', notificationId), { isRead: true });
    } catch {
      // Ignore fallback
    }
  }

  /**
   * Fetch Recent Audit Logs for Activity Timeline
   */
  async getRecentAuditLogs(limitCount = 10): Promise<{ id: string; title: string; description: string; timestamp: string; category: string }[]> {
    try {
      const q = query(collection(db, 'admin_audit_logs'), orderBy('timestamp', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: `${data.whatAction || 'System Action'}`,
          description: `Executed by ${data.whoName || 'System User'} on ${data.entityName || 'ERP Object'}`,
          timestamp: data.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          category: data.entityName || 'System',
        };
      });
    } catch {
      return [];
    }
  }
}

export const dashboardRepository = new DashboardRepository();
