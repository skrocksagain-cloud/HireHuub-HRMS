import { addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, Timestamp, updateDoc, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

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
  return { id: snapshot.id, documentType: 'request', employeeId: String(data.employeeId ?? ''), employeeName: String(data.employeeName ?? ''), department: String(data.department ?? ''), requestType: data.requestType === 'WFH' ? 'WFH' : 'Regularization', attendanceDate: String(data.attendanceDate ?? ''), reason: String(data.reason ?? ''), status: data.status as AttendanceRequest['status'], approverEmployeeId: typeof data.approverEmployeeId === 'string' ? data.approverEmployeeId : null, decisionReason: String(data.decisionReason ?? ''), createdAt: asTimestamp(data.createdAt), updatedAt: asTimestamp(data.updatedAt) };
};

export interface AttendanceRepository {
  getDaily(employeeId: string, attendanceDate: string): Promise<DailyAttendance | null>;
  getDailyForEmployee(employeeId: string, from: string, to: string): Promise<DailyAttendance[]>;
  getDailyForOrganization(from: string, to: string): Promise<DailyAttendance[]>;
  getRequestsForEmployee(employeeId: string): Promise<AttendanceRequest[]>;
  getPendingRequests(): Promise<AttendanceRequest[]>;
  createDaily(record: Omit<DailyAttendance, 'id' | 'createdAt' | 'updatedAt'> & DeviceDetails): Promise<DailyAttendance>;
  createStatusDaily(record: Omit<DailyAttendance, 'id' | 'createdAt' | 'updatedAt' | 'loginTime' | 'logoutTime' | 'totalWorkMinutes'>): Promise<void>;
  updateDaily(recordId: string, changes: Partial<DailyAttendance>): Promise<void>;
  closeDaily(recordId: string, status: AttendanceStatus, totalWorkMinutes: number): Promise<void>;
  createRequest(request: Omit<AttendanceRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'approverEmployeeId' | 'decisionReason' | 'documentType'>): Promise<void>;
  decideRequest(requestId: string, approverEmployeeId: string, status: 'Approved' | 'Rejected', decisionReason: string): Promise<void>;
  isHoliday(attendanceDate: string): Promise<boolean>;
  hasApprovedLeave(employeeId: string, attendanceDate: string): Promise<boolean>;
}

class FirestoreAttendanceRepository implements AttendanceRepository {
  async getDaily(employeeId: string, attendanceDate: string): Promise<DailyAttendance | null> {
    const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('documentType', '==', 'daily'), where('employeeId', '==', employeeId), where('attendanceDate', '==', attendanceDate), limit(1)));
    return result.docs[0] ? dailyFrom(result.docs[0]) : null;
  }

  async getDailyForEmployee(employeeId: string, from: string, to: string): Promise<DailyAttendance[]> {
    const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('documentType', '==', 'daily'), where('employeeId', '==', employeeId), where('attendanceDate', '>=', from), where('attendanceDate', '<=', to), orderBy('attendanceDate', 'desc')));
    return result.docs.map(dailyFrom);
  }

  async getDailyForOrganization(from: string, to: string): Promise<DailyAttendance[]> {
    const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('documentType', '==', 'daily'), where('attendanceDate', '>=', from), where('attendanceDate', '<=', to), orderBy('attendanceDate', 'desc')));
    return result.docs.map(dailyFrom);
  }

  async getRequestsForEmployee(employeeId: string): Promise<AttendanceRequest[]> {
    const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('documentType', '==', 'request'), where('employeeId', '==', employeeId), orderBy('createdAt', 'desc')));
    return result.docs.map(requestFrom);
  }

  async getPendingRequests(): Promise<AttendanceRequest[]> {
    const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where('documentType', '==', 'request'), where('status', '==', 'Pending'), orderBy('createdAt', 'desc')));
    return result.docs.map(requestFrom);
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
    await addDoc(collection(db, ATTENDANCE_COLLECTION), { ...request, documentType: 'request', status: 'Pending', approverEmployeeId: null, decisionReason: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }

  async decideRequest(requestId: string, approverEmployeeId: string, status: 'Approved' | 'Rejected', decisionReason: string): Promise<void> {
    await updateDoc(doc(db, ATTENDANCE_COLLECTION, requestId), { status, approverEmployeeId, decisionReason, updatedAt: serverTimestamp() });
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
