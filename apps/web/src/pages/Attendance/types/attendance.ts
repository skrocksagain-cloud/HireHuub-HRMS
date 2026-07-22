import type { Timestamp } from 'firebase/firestore';

export type AttendanceStatus = 'Present' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Week Off' | 'Absent';
export type AttendanceRole = 'Recruiter' | 'Team Leader' | 'Manager' | 'HR' | 'Accounts' | 'Admin' | 'Super Admin';
export type AttendanceRequestType = 'Regularisation' | 'Work From Home' | 'Leave' | 'Late' | 'Half Day' | 'Holiday';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface DeviceDetails {
  deviceType: 'Web' | 'Mobile';
  browser: string;
  operatingSystem: string;
  ipAddress: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
}

export interface AttendanceSession extends DeviceDetails {
  id: string;
  employeeId: string;
  loginTime: Timestamp;
  logoutTime: Timestamp | null;
  createdAt: Timestamp;
}

export interface DailyAttendance {
  id: string;
  employeeId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  sessionCount: number;
  firstLoginTime: Timestamp | null;
  lastLogoutTime: Timestamp | null;
  isLocked: boolean;
  updatedAt: Timestamp;
}

export interface AttendanceRequest {
  id: string;
  employeeId: string;
  type: AttendanceRequestType;
  attendanceDate: string;
  reason: string;
  status: ApprovalStatus;
  approverRole: 'Manager' | 'Super Admin';
  createdAt: Timestamp;
}

export interface AttendanceAuditLog extends DeviceDetails {
  userId: string;
  role: AttendanceRole;
  action: string;
  reason: string;
  oldValue: string;
  newValue: string;
  timestamp: Timestamp;
}

export interface AttendanceDashboardData {
  today: DailyAttendance | null;
  openSession: AttendanceSession | null;
  monthlyDays: DailyAttendance[];
  pendingRequests: AttendanceRequest[];
}

export interface AttendanceEmployee {
  employeeId: string;
  name: string;
  role: AttendanceRole;
  department: string;
}
