import { addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, Timestamp, updateDoc, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

import { db } from '../../../firebase/firebase';
import { LEAVE_BALANCES_COLLECTION, LEAVE_REQUESTS_COLLECTION } from '../constants/leave';
import type { LeaveBalance, LeaveRequest, LeaveStatus } from '../types/leave';

const timestamp = (value: unknown): Timestamp => value instanceof Timestamp ? value : Timestamp.now();
const requestFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): LeaveRequest => { const data = snapshot.data(); return { id: snapshot.id, employeeId: String(data.employeeId ?? ''), employeeName: String(data.employeeName ?? ''), department: String(data.department ?? ''), requestType: data.requestType === 'Comp Off' ? 'Comp Off' : 'Leave', leaveType: String(data.leaveType ?? ''), startDate: String(data.startDate ?? ''), endDate: String(data.endDate ?? ''), days: Number(data.days ?? 0), reason: String(data.reason ?? ''), medicalCertificateReference: String(data.medicalCertificateReference ?? ''), status: data.status as LeaveStatus, approverEmployeeId: typeof data.approverEmployeeId === 'string' ? data.approverEmployeeId : null, decisionReason: String(data.decisionReason ?? ''), isArchived: Boolean(data.isArchived), createdAt: timestamp(data.createdAt), updatedAt: timestamp(data.updatedAt) }; };
const balanceFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): LeaveBalance => { const data = snapshot.data(); return { id: snapshot.id, employeeId: String(data.employeeId ?? ''), leaveType: String(data.leaveType ?? ''), available: Number(data.available ?? 0), credited: Number(data.credited ?? 0), carriedForward: Number(data.carriedForward ?? 0), used: Number(data.used ?? 0), updatedAt: timestamp(data.updatedAt) }; };

export interface LeaveRepository {
  getBalances(employeeId: string): Promise<LeaveBalance[]>;
  getRequestsForEmployee(employeeId: string): Promise<LeaveRequest[]>;
  getPendingRequests(): Promise<LeaveRequest[]>;
  getOrganizationRequests(): Promise<LeaveRequest[]>;
  getRequest(requestId: string): Promise<LeaveRequest | null>;
  createRequest(request: Omit<LeaveRequest, 'id' | 'status' | 'approverEmployeeId' | 'decisionReason' | 'isArchived' | 'createdAt' | 'updatedAt'>): Promise<void>;
  decideRequest(requestId: string, approverEmployeeId: string, status: 'Approved' | 'Rejected', decisionReason: string): Promise<void>;
  cancelRequest(requestId: string): Promise<void>;
  updateBalance(balanceId: string, changes: Partial<LeaveBalance>): Promise<void>;
}

class FirestoreLeaveRepository implements LeaveRepository {
  async getBalances(employeeId: string): Promise<LeaveBalance[]> { const result = await getDocs(query(collection(db, LEAVE_BALANCES_COLLECTION), where('employeeId', '==', employeeId), orderBy('leaveType'))); return result.docs.map(balanceFrom); }
  async getRequestsForEmployee(employeeId: string): Promise<LeaveRequest[]> { const result = await getDocs(query(collection(db, LEAVE_REQUESTS_COLLECTION), where('employeeId', '==', employeeId), where('isArchived', '==', false), orderBy('createdAt', 'desc'))); return result.docs.map(requestFrom); }
  async getPendingRequests(): Promise<LeaveRequest[]> { const result = await getDocs(query(collection(db, LEAVE_REQUESTS_COLLECTION), where('status', '==', 'Pending'), where('isArchived', '==', false), orderBy('createdAt', 'desc'))); return result.docs.map(requestFrom); }
  async getOrganizationRequests(): Promise<LeaveRequest[]> { const result = await getDocs(query(collection(db, LEAVE_REQUESTS_COLLECTION), where('isArchived', '==', false), orderBy('createdAt', 'desc'), limit(100))); return result.docs.map(requestFrom); }
  async getRequest(requestId: string): Promise<LeaveRequest | null> { const result = await getDocs(query(collection(db, LEAVE_REQUESTS_COLLECTION), where('__name__', '==', requestId), limit(1))); return result.docs[0] ? requestFrom(result.docs[0]) : null; }
  async createRequest(request: Omit<LeaveRequest, 'id' | 'status' | 'approverEmployeeId' | 'decisionReason' | 'isArchived' | 'createdAt' | 'updatedAt'>): Promise<void> { await addDoc(collection(db, LEAVE_REQUESTS_COLLECTION), { ...request, status: 'Pending', approverEmployeeId: null, decisionReason: '', isArchived: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); }
  async decideRequest(requestId: string, approverEmployeeId: string, status: 'Approved' | 'Rejected', decisionReason: string): Promise<void> { await updateDoc(doc(db, LEAVE_REQUESTS_COLLECTION, requestId), { status, approverEmployeeId, decisionReason, updatedAt: serverTimestamp() }); }
  async cancelRequest(requestId: string): Promise<void> { await updateDoc(doc(db, LEAVE_REQUESTS_COLLECTION, requestId), { status: 'Cancelled', updatedAt: serverTimestamp() }); }
  async updateBalance(balanceId: string, changes: Partial<LeaveBalance>): Promise<void> { await updateDoc(doc(db, LEAVE_BALANCES_COLLECTION, balanceId), { ...changes, updatedAt: serverTimestamp() }); }
}

export const leaveRepository: LeaveRepository = new FirestoreLeaveRepository();
