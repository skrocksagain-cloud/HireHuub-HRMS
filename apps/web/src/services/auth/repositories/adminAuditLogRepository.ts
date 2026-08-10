import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import type { AdminAuditLog } from '../../../types/auth';

const ADMIN_AUDIT_LOGS_COLLECTION = 'admin_audit_logs';

export interface AdminAuditLogRepository {
  createAdminAuditLog(logData: Omit<AdminAuditLog, 'id'>): Promise<string>;
  getUnlockRequests(employeeId?: string): Promise<AdminAuditLog[]>;
}

export class FirestoreAdminAuditLogRepository implements AdminAuditLogRepository {
  async createAdminAuditLog(logData: Omit<AdminAuditLog, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, ADMIN_AUDIT_LOGS_COLLECTION), {
      ...logData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async getUnlockRequests(employeeId?: string): Promise<AdminAuditLog[]> {
    let q = query(
      collection(db, ADMIN_AUDIT_LOGS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (employeeId) {
      q = query(
        collection(db, ADMIN_AUDIT_LOGS_COLLECTION),
        where('targetEmployeeId', '==', employeeId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        actorId: typeof data.actorId === 'string' ? data.actorId : '',
        actorName: typeof data.actorName === 'string' ? data.actorName : '',
        action: data.action || 'UNLOCK_REQUEST',
        targetEmployeeId: typeof data.targetEmployeeId === 'string' ? data.targetEmployeeId : '',
        targetEmployeeName: typeof data.targetEmployeeName === 'string' ? data.targetEmployeeName : '',
        reason: typeof data.reason === 'string' ? data.reason : undefined,
        status: data.status || 'PENDING',
        timestamp: typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
        metadata: typeof data.metadata === 'object' && data.metadata ? (data.metadata as Record<string, string | number | boolean | null>) : undefined,
      };
    });
  }
}

export const adminAuditLogRepository: AdminAuditLogRepository = new FirestoreAdminAuditLogRepository();
