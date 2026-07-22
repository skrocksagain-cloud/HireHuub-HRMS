import type { Timestamp } from 'firebase/firestore';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveRequestType = 'Leave' | 'Comp Off';

export interface LeaveActor { employeeId: string; name: string; role: string; department: string; }
export interface LeaveBalance { id: string; employeeId: string; leaveType: string; available: number; credited: number; carriedForward: number; used: number; updatedAt: Timestamp; }
export interface LeaveRequest { id: string; employeeId: string; employeeName: string; department: string; requestType: LeaveRequestType; leaveType: string; startDate: string; endDate: string; days: number; reason: string; medicalCertificateReference: string; status: LeaveStatus; approverEmployeeId: string | null; decisionReason: string; isArchived: boolean; createdAt: Timestamp; updatedAt: Timestamp; }
export interface LeaveSummary { approvedDays: number; pendingDays: number; lopDays: number; compOffDays: number; carriedForward: number; }
export interface LeaveDashboardData { balances: LeaveBalance[]; requests: LeaveRequest[]; approvalRequests: LeaveRequest[]; organizationRequests: LeaveRequest[]; }
export interface LeaveApplicationInput { requestType: LeaveRequestType; leaveType: string; startDate: string; endDate: string; reason: string; medicalCertificateReference: string; }
export interface LeaveDecisionInput { requestId: string; decision: 'Approved' | 'Rejected'; reason: string; }
export interface CarryForwardInput { balanceId: string; days: number; }
