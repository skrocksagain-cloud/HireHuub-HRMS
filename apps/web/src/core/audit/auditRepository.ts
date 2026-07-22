import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '../../firebase/firebase';
import type { AuditEntry } from './auditService';

export interface AuditRepository {
  create(entry: AuditEntry): Promise<void>;
}

class FirestoreAuditRepository implements AuditRepository {
  async create(entry: AuditEntry): Promise<void> {
    await addDoc(collection(db, 'auditLogs'), { ...entry, createdAt: serverTimestamp() });
  }
}

export const auditRepository: AuditRepository = new FirestoreAuditRepository();
