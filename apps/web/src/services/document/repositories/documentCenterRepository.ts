import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { adminService } from '../../admin/adminService';
import type { DocumentRecord } from '../documentService';
import type { RegisteredDocument, DocumentFilterOptions } from '../../../types/DocumentCenter';

const DOCUMENTS_COLLECTION = 'documents';
const COUNTERS_COLLECTION = 'document_counters';

import { query, where } from 'firebase/firestore';
import { getAuthorizationScope } from '../../../core/authorization/authorizationResolver';

class DocumentCenterRepository {
  async getDocuments(filters?: DocumentFilterOptions): Promise<RegisteredDocument[]> {
    try {
      const constraints: any[] = [];
      
      if (filters?.module) constraints.push(where('module', '==', filters.module));
      if (filters?.referenceId) constraints.push(where('referenceId', '==', filters.referenceId));
      if (filters?.documentId) constraints.push(where('documentId', '==', filters.documentId));
      
      if (constraints.length === 0) {
        return []; // Fail safely: Never execute parameterless global fetch
      }

      const q = query(collection(db, DOCUMENTS_COLLECTION), ...constraints);
      const snap = await getDocs(q);
      let list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RegisteredDocument, 'id'>) }));

      if (filters?.documentType) {
        const lowerSearch = filters.documentType.toLowerCase();
        list = list.filter((item) => 
          item.documentType?.toLowerCase().includes(lowerSearch)
        );
      }
      return list;
    } catch {
      return [];
    }
  }

  async getAllDocumentsGlobally(canonicalRole: string): Promise<RegisteredDocument[]> {
    if (getAuthorizationScope(canonicalRole) !== 'GLOBAL') {
      return []; // Must be explicit GLOBAL canonical scope
    }
    try {
      const snap = await getDocs(collection(db, DOCUMENTS_COLLECTION));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RegisteredDocument, 'id'>) }));
    } catch {
      return [];
    }
  }

  async getDocumentById(id: string): Promise<RegisteredDocument | null> {
    try {
      const snap = await getDoc(doc(db, DOCUMENTS_COLLECTION, id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as Omit<RegisteredDocument, 'id'>) };
    } catch {
      return null;
    }
  }

  async registerDocument(docData: RegisteredDocument): Promise<void> {
    const docRef = doc(db, DOCUMENTS_COLLECTION, docData.id);
    await setDoc(docRef, docData, { merge: true });
  }

  async saveDocument(record: Omit<DocumentRecord, 'id'> & { id?: string }): Promise<DocumentRecord> {
    const docId = record.id || `doc_${Date.now()}`;
    const docRef = doc(db, DOCUMENTS_COLLECTION, docId);
    const now = new Date().toISOString();

    const payload: DocumentRecord = {
      ...record,
      id: docId,
      createdAt: record.createdAt || now,
      updatedAt: now,
    };

    await setDoc(docRef, payload, { merge: true });
    return payload;
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const existing = await this.getDocumentById(id);
    if (existing) {
      const docRef = doc(db, DOCUMENTS_COLLECTION, id);
      await updateDoc(docRef, { downloadCount: (existing.downloadCount || 0) + 1 });
    }
  }

  async updateDocumentStatus(id: string, status: RegisteredDocument['status']): Promise<void> {
    const docRef = doc(db, DOCUMENTS_COLLECTION, id);
    await updateDoc(docRef, { status });
  }

  async deleteDocument(id: string): Promise<void> {
    await deleteDoc(doc(db, DOCUMENTS_COLLECTION, id));
  }

  async getNextDocumentNumber(): Promise<string> {
    const company = await adminService.getCompanySettings();
    if (!company) throw new Error('Company settings not found');
    if (!company.documentPrefix?.trim()) {
      throw new Error('Administration → Company Settings is missing the document prefix.');
    }
    const year = new Date().getFullYear();
    const counterRef = doc(db, COUNTERS_COLLECTION, `${year}`);

    const count = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let newCount = 1;
      if (counterDoc.exists()) {
        newCount = (counterDoc.data().count || 0) + 1;
      }
      transaction.set(counterRef, { count: newCount }, { merge: true });
      return newCount;
    });

    return `${company.documentPrefix}${year}-${String(count).padStart(4, '0')}`;
  }
}

export const documentCenterRepository = new DocumentCenterRepository();
