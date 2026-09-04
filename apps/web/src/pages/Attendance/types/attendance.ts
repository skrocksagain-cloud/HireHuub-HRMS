import type { Timestamp } from 'firebase/firestore';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Holiday' | 'Week Off' | 'Leave' | 'WFH' | 'Regularization Pending';
export type AttendanceRequestType = 'Regularization' | 'WFH';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface AttendanceActor {
  employeeId: string;
  name: string;
  role: string;
  department: string;
}

export interface DeviceDetails {
  deviceType: 'Mobile' | 'Desktop';
  latitude: number | null;
  longitude: number | null;
  address: string;
}

export interface DailyAttendance {
  id: string;
  documentType: 'daily';
  employeeId: string;
  employeeName: string;
  department: string;
  attendanceDate: string;
  status: AttendanceStatus;
  loginTime: Timestamp | null;
  logoutTime: Timestamp | null;
  totalWorkMinutes: number;
  isLocked: boolean;
  deviceType?: string;
  address?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ApprovalStageStatus =
  | 'Pending Manager Approval'
  | 'Approved by Manager'
  | 'Fully Approved'
  | 'Rejected';

export interface AttendanceRequest {
  id: string;
  documentType: 'request';
  employeeId: string;
  employeeName: string;
  department: string;
  requestType: AttendanceRequestType;
  attendanceDate: string;
  reason: string;
  status: ApprovalStatus;
  approvalStage?: ApprovalStageStatus;
  managerApproved?: boolean;
  managerApproverId?: string | null;
  managerApprovedAt?: Timestamp | null;
  adminApproved?: boolean;
  adminApproverId?: string | null;
  adminApprovedAt?: Timestamp | null;
  approverEmployeeId: string | null;
  decisionReason: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AttendanceDashboardData {
  today: DailyAttendance | null;
  monthRecords: DailyAttendance[];
  requests: AttendanceRequest[];
  organizationRecords: DailyAttendance[];
}

export interface AttendanceSummary {
  workingDays: number;
  lopDays: number;
  lateCount: number;
  halfDayCount: number;
  presentCount: number;
  wfhCount: number;
}

export interface AttendanceFilters {
  search: string;
  department: string;
  status: AttendanceStatus | '';
  month: string;
  dateFrom: string;
  dateTo: string;
}

export interface AttendanceApprovalInput {
  requestId: string;
  decision: Extract<ApprovalStatus, 'Approved' | 'Rejected'>;
  reason: string;
}
