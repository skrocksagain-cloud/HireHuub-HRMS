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
import type { AuthLog } from '../../../types/auth';

const AUTH_LOGS_COLLECTION = 'authentication_logs';

export interface AuthLogRepository {
  createAuthLog(logData: Omit<AuthLog, 'id'>): Promise<string>;
  getAuthLogs(employeeId?: string, limitCount?: number): Promise<AuthLog[]>;
}

export class FirestoreAuthLogRepository implements AuthLogRepository {
  async createAuthLog(logData: Omit<AuthLog, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, AUTH_LOGS_COLLECTION), {
      ...logData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async getAuthLogs(employeeId?: string, limitCount = 50): Promise<AuthLog[]> {
    let q = query(
      collection(db, AUTH_LOGS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (employeeId) {
      q = query(
        collection(db, AUTH_LOGS_COLLECTION),
        where('employeeId', '==', employeeId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        employeeId: typeof data.employeeId === 'string' ? data.employeeId : '',
        eventType: data.eventType || 'Login',
        timestamp: typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
        status: data.status === 'failure' ? 'failure' : 'success',
        details: typeof data.details === 'object' && data.details ? (data.details as Record<string, string | number | boolean | null>) : undefined,
        ipAddress: typeof data.ipAddress === 'string' ? data.ipAddress : undefined,
        userAgent: typeof data.userAgent === 'string' ? data.userAgent : undefined,
      };
    });
  }
}

export const authLogRepository: AuthLogRepository = new FirestoreAuthLogRepository();
