import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '../../firebase/firebase';
import type { AuditEntry } from './auditService';

function sanitizeForFirestore<T>(val: T): T {
  if (val === undefined || val === null) {
    return null as T;
  }
  if (typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(val as Record<string, unknown>)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeForFirestore(value);
    }
  }
  return cleaned as T;
}

export interface AuditRepository {
  create(entry: AuditEntry): Promise<void>;
}

class FirestoreAuditRepository implements AuditRepository {
  async create(entry: AuditEntry): Promise<void> {
    const sanitizedEntry = sanitizeForFirestore(entry);
    await addDoc(collection(db, 'auditLogs'), { ...sanitizedEntry, createdAt: serverTimestamp() });
  }
}

export const auditRepository: AuditRepository = new FirestoreAuditRepository();
