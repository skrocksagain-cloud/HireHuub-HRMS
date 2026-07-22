import { addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore';

import { db } from '../../../firebase/firebase';
import { ATTENDANCE_COLLECTIONS } from '../constants/attendance';
import type { AttendanceRequest, AttendanceSession, DailyAttendance, DeviceDetails } from '../types/attendance';

const timestamp = (value: unknown): Timestamp => value instanceof Timestamp ? value : Timestamp.now();
const nullableTimestamp = (value: unknown): Timestamp | null => value instanceof Timestamp ? value : null;
const sessionFrom = (id: string, data: Record<string, unknown>): AttendanceSession => ({ id, employeeId: String(data.employeeId ?? ''), loginTime: timestamp(data.loginTime), logoutTime: nullableTimestamp(data.logoutTime), createdAt: timestamp(data.createdAt), deviceType: data.deviceType === 'Mobile' ? 'Mobile' : 'Web', browser: String(data.browser ?? ''), operatingSystem: String(data.operatingSystem ?? ''), ipAddress: String(data.ipAddress ?? ''), latitude: typeof data.latitude === 'number' ? data.latitude : null, longitude: typeof data.longitude === 'number' ? data.longitude : null, address: String(data.address ?? '') });
const dailyFrom = (id: string, data: Record<string, unknown>): DailyAttendance => ({ id, employeeId: String(data.employeeId ?? ''), attendanceDate: String(data.attendanceDate ?? ''), status: data.status as DailyAttendance['status'], totalWorkMinutes: Number(data.totalWorkMinutes ?? 0), totalBreakMinutes: Number(data.totalBreakMinutes ?? 0), sessionCount: Number(data.sessionCount ?? 0), firstLoginTime: nullableTimestamp(data.firstLoginTime), lastLogoutTime: nullableTimestamp(data.lastLogoutTime), isLocked: Boolean(data.isLocked), updatedAt: timestamp(data.updatedAt) });
const requestFrom = (id: string, data: Record<string, unknown>): AttendanceRequest => ({ id, employeeId: String(data.employeeId ?? ''), type: data.type as AttendanceRequest['type'], attendanceDate: String(data.attendanceDate ?? ''), reason: String(data.reason ?? ''), status: data.status as AttendanceRequest['status'], approverRole: data.approverRole === 'Super Admin' ? 'Super Admin' : 'Manager', createdAt: timestamp(data.createdAt) });

export interface AttendanceRepository {
  getOpenSession(employeeId: string): Promise<AttendanceSession | null>;
  getDaily(employeeId: string, attendanceDate: string): Promise<DailyAttendance | null>;
  getMonthlyDaily(employeeId: string, start: string, end: string): Promise<DailyAttendance[]>;
  getPendingRequests(employeeId: string): Promise<AttendanceRequest[]>;
  createSession(employeeId: string, device: DeviceDetails): Promise<AttendanceSession>;
  closeSession(sessionId: string): Promise<void>;
  saveDaily(daily: Omit<DailyAttendance, 'id' | 'updatedAt'>): Promise<void>;
  createRequest(request: Omit<AttendanceRequest, 'id' | 'createdAt' | 'status'>): Promise<void>;
}

class FirestoreAttendanceRepository implements AttendanceRepository {
  async getOpenSession(employeeId: string) { const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTIONS.sessions), where('employeeId', '==', employeeId), where('logoutTime', '==', null), orderBy('loginTime', 'desc'), limit(1))); return result.docs[0] ? sessionFrom(result.docs[0].id, result.docs[0].data()) : null; }
  async getDaily(employeeId: string, attendanceDate: string) { const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTIONS.daily), where('employeeId', '==', employeeId), where('attendanceDate', '==', attendanceDate), limit(1))); return result.docs[0] ? dailyFrom(result.docs[0].id, result.docs[0].data()) : null; }
  async getMonthlyDaily(employeeId: string, start: string, end: string) { const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTIONS.daily), where('employeeId', '==', employeeId), where('attendanceDate', '>=', start), where('attendanceDate', '<=', end), orderBy('attendanceDate', 'desc'))); return result.docs.map((item) => dailyFrom(item.id, item.data())); }
  async getPendingRequests(employeeId: string) { const result = await getDocs(query(collection(db, ATTENDANCE_COLLECTIONS.approvals), where('employeeId', '==', employeeId), where('status', '==', 'Pending'), orderBy('createdAt', 'desc'))); return result.docs.map((item) => requestFrom(item.id, item.data())); }
  async createSession(employeeId: string, device: DeviceDetails) { const loginTime = Timestamp.now(); const result = await addDoc(collection(db, ATTENDANCE_COLLECTIONS.sessions), { employeeId, ...device, loginTime, logoutTime: null, createdAt: serverTimestamp() }); return { id: result.id, employeeId, ...device, loginTime, logoutTime: null, createdAt: loginTime }; }
  async closeSession(sessionId: string) { await updateDoc(doc(db, ATTENDANCE_COLLECTIONS.sessions, sessionId), { logoutTime: serverTimestamp() }); }
  async saveDaily(daily: Omit<DailyAttendance, 'id' | 'updatedAt'>) { const existing = await this.getDaily(daily.employeeId, daily.attendanceDate); const payload = { ...daily, updatedAt: serverTimestamp() }; if (existing) await updateDoc(doc(db, ATTENDANCE_COLLECTIONS.daily, existing.id), payload); else await addDoc(collection(db, ATTENDANCE_COLLECTIONS.daily), payload); }
  async createRequest(request: Omit<AttendanceRequest, 'id' | 'createdAt' | 'status'>) { await addDoc(collection(db, ATTENDANCE_COLLECTIONS.approvals), { ...request, status: 'Pending', createdAt: serverTimestamp() }); }
}

export const attendanceRepository: AttendanceRepository = new FirestoreAttendanceRepository();
