import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, Timestamp, updateDoc, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

import { db } from '../../../firebase/firebase';
import { ATTENDANCE_COLLECTION, HOLIDAYS_COLLECTION, LEAVE_REQUESTS_COLLECTION } from '../constants/attendance';
import type { AttendanceRequest, AttendanceStatus, DailyAttendance, DeviceDetails } from '../types/attendance';

const asTimestamp = (value: unknown): Timestamp => value instanceof Timestamp ? value : Timestamp.now();
const nullableTimestamp = (value: unknown): Timestamp | null => value instanceof Timestamp ? value : null;

const dailyFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): DailyAttendance => {
  const data = snapshot.data();
  return { id: snapshot.id, documentType: 'daily', employeeId: String(data.employeeId ?? ''), employeeName: String(data.employeeName ?? ''), department: String(data.department ?? ''), attendanceDate: String(data.attendanceDate ?? ''), status: data.status as AttendanceStatus, loginTime: nullableTimestamp(data.loginTime), logoutTime: nullableTimestamp(data.logoutTime), totalWorkMinutes: Number(data.totalWorkMinutes ?? 0), isLocked: Boolean(data.isLocked), createdAt: asTimestamp(data.createdAt), updatedAt: asTimestamp(data.updatedAt) };
};

const requestFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): AttendanceRequest => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    documentType: 'request',
    employeeId: String(data.employeeId ?? ''),
    employeeName: String(data.employeeName ?? ''),
    department: String(data.department ?? ''),
    requestType: data.requestType === 'WFH' ? 'WFH' : 'Regularization',
    attendanceDate: String(data.attendanceDate ?? ''),
    reason: String(data.reason ?? ''),
    status: (data.status as AttendanceRequest['status']) || 'Pending',
    approvalStage: (data.approvalStage as any) || 'Pending Manager Approval',
    managerApproved: Boolean(data.managerApproved),
    managerApproverId: typeof data.managerApproverId === 'string' ? data.managerApproverId : null,
    managerApprovedAt: nullableTimestamp(data.managerApprovedAt),
    adminApproved: Boolean(data.adminApproved),
    adminApproverId: typeof data.adminApproverId === 'string' ? data.adminApproverId : null,
    adminApprovedAt: nullableTimestamp(data.adminApprovedAt),
    approverEmployeeId: typeof data.approverEmployeeId === 'string' ? data.approverEmployeeId : null,
    decisionReason: String(data.decisionReason ?? ''),
    createdAt: asTimestamp(data.createdAt),
    updatedAt: asTimestamp(data.updatedAt),
  };
};

export interface AttendanceRepository {
  getDaily(employeeId: string, attendanceDate: string): Promise<DailyAttendance | null>;
  getDailyForEmployee(employeeId: string, from: string, to: string): Promise<DailyAttendance[]>;
  getDailyForOrganization(from: string, to: string): Promise<DailyAttendance[]>;
  getDailyForDepartment(from: string, to: string, department: string): Promise<DailyAttendance[]>;
  getRequestsForEmployee(employeeId: string): Promise<AttendanceRequest[]>;
  getPendingRequests(): Promise<AttendanceRequest[]>;
  getPendingRequestsForDepartment(department: string): Promise<AttendanceRequest[]>;
  createDaily(record: Omit<DailyAttendance, 'id' | 'createdAt' | 'updatedAt'> & DeviceDetails): Promise<DailyAttendance>;
  createStatusDaily(record: Omit<DailyAttendance, 'id' | 'createdAt' | 'updatedAt' | 'loginTime' | 'logoutTime' | 'totalWorkMinutes'>): Promise<void>;
  updateDaily(recordId: string, changes: Partial<DailyAttendance>): Promise<void>;
  closeDaily(recordId: string, status: AttendanceStatus, totalWorkMinutes: number): Promise<void>;
  createRequest(request: Omit<AttendanceRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'approverEmployeeId' | 'decisionReason' | 'documentType'>): Promise<void>;
  decideRequest(requestId: string, approverEmployeeId: string, status: 'Approved' | 'Rejected', decisionReason: string): Promise<void>;
  updateRequestStage(requestId: string, changes: Partial<AttendanceRequest>): Promise<void>;
  isHoliday(attendanceDate: string): Promise<boolean>;
  hasApprovedLeave(employeeId: string, attendanceDate: string): Promise<boolean>;
}

class FirestoreAttendanceRepository implements AttendanceRepository {
  async getDaily(employeeId: string, attendanceDate: string): Promise<DailyAttendance | null> {
    const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('documentType', '==', 'daily'), where('employeeId', '==', employeeId), where('attendanceDate', '==', attendanceDate), limit(1)));
    return result.docs[0] ? dailyFrom(result.docs[0]) : null;
  }

  async getDailyForEmployee(employeeId: string, from: string, to: string): Promise<DailyAttendance[]> {
    const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('documentType', '==', 'daily'), where('employeeId', '==', employeeId)));
    const list = result.docs.map(dailyFrom).filter((item) => item.attendanceDate >= from && item.attendanceDate <= to);
    return list.sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
  }

  async getDailyForOrganization(from: string, to: string): Promise<DailyAttendance[]> {
    const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('documentType', '==', 'daily')));
    const list = result.docs.map(dailyFrom).filter((item) => item.attendanceDate >= from && item.attendanceDate <= to);
    return list.sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
  }

  async getDailyForDepartment(from: string, to: string, department: string): Promise<DailyAttendance[]> {
    if (!department?.trim()) return [];
    const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('documentType', '==', 'daily'), where('department', '==', department)));
    const list = result.docs.map(dailyFrom).filter((item) => item.attendanceDate >= from && item.attendanceDate <= to);
    return list.sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
  }

  async getRequestsForEmployee(employeeId: string): Promise<AttendanceRequest[]> {
    const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('documentType', '==', 'request'), where('employeeId', '==', employeeId)));
    const list = result.docs.map(requestFrom);
    return list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  }

  async getPendingRequests(): Promise<AttendanceRequest[]> {
    const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('documentType', '==', 'request')));
    const list = result.docs.map(requestFrom).filter((item) => item.status === 'Pending' || item.approvalStage !== 'Fully Approved');
    return list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  }

  async getPendingRequestsForDepartment(department: string): Promise<AttendanceRequest[]> {
    if (!department?.trim()) return [];
    const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('documentType', '==', 'request'), where('department', '==', department)));
    const list = result.docs.map(requestFrom).filter((item) => item.status === 'Pending' || item.approvalStage !== 'Fully Approved');
    return list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  }

  async createDaily(record: Omit<DailyAttendance, 'id' | 'createdAt' | 'updatedAt'> & DeviceDetails): Promise<DailyAttendance> {
    const now = Timestamp.now();
    const savedRecord = { ...record, loginTime: now, documentType: 'daily' as const };
    const result = await addDoc(collection(db, ATTENDANCE_COLLECTION), { ...savedRecord, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { ...savedRecord, id: result.id, createdAt: now, updatedAt: now };
  }

  async createStatusDaily(record: Omit<DailyAttendance, 'id' | 'createdAt' | 'updatedAt' | 'loginTime' | 'logoutTime' | 'totalWorkMinutes'>): Promise<void> {
    await addDoc(collection(db, ATTENDANCE_COLLECTION), { ...record, documentType: 'daily', loginTime: null, logoutTime: null, totalWorkMinutes: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }

  async updateDaily(recordId: string, changes: Partial<DailyAttendance>): Promise<void> {
    await updateDoc(doc(db, ATTENDANCE_COLLECTION, recordId), { ...changes, updatedAt: serverTimestamp() });
  }

  async closeDaily(recordId: string, status: AttendanceStatus, totalWorkMinutes: number): Promise<void> {
    await updateDoc(doc(db, ATTENDANCE_COLLECTION, recordId), { logoutTime: serverTimestamp(), status, totalWorkMinutes, updatedAt: serverTimestamp() });
  }

  async createRequest(request: Omit<AttendanceRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'approverEmployeeId' | 'decisionReason' | 'documentType'>): Promise<void> {
    await addDoc(collection(db, ATTENDANCE_COLLECTION), {
      ...request,
      documentType: 'request',
      status: 'Pending',
      approvalStage: 'Pending Manager Approval',
      managerApproved: false,
      managerApproverId: null,
      adminApproved: false,
      adminApproverId: null,
      approverEmployeeId: null,
      decisionReason: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async decideRequest(requestId: string, approverEmployeeId: string, status: 'Approved' | 'Rejected', decisionReason: string): Promise<void> {
    await updateDoc(doc(db, ATTENDANCE_COLLECTION, requestId), { status, approverEmployeeId, decisionReason, updatedAt: serverTimestamp() });
  }

  async updateRequestStage(requestId: string, changes: Partial<AttendanceRequest>): Promise<void> {
    await updateDoc(doc(db, ATTENDANCE_COLLECTION, requestId), { ...changes, updatedAt: serverTimestamp() });
  }

  async isHoliday(attendanceDate: string): Promise<boolean> {
    const result = await getDocs(query(collection(db, HOLIDAYS_COLLECTION), where('date', '==', attendanceDate), limit(1)));
    return !result.empty;
  }

  async hasApprovedLeave(employeeId: string, attendanceDate: string): Promise<boolean> {
    const result = await getDocs(query(collection(db, LEAVE_REQUESTS_COLLECTION), where('employeeId', '==', employeeId), where('status', '==', 'Approved'), where('startDate', '<=', attendanceDate), where('endDate', '>=', attendanceDate), limit(1)));
    return !result.empty;
  }
}

export const attendanceRepository: AttendanceRepository = new FirestoreAttendanceRepository();
