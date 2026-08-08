import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import type { DocumentFilterOptions, RegisteredDocument } from '../../../types/DocumentCenter';

export interface DocumentCenterRepository {
  registerDocument(docData: RegisteredDocument): Promise<void>;
  getDocumentById(id: string): Promise<RegisteredDocument | null>;
  getDocuments(filters?: DocumentFilterOptions): Promise<RegisteredDocument[]>;
  incrementDownloadCount(id: string): Promise<void>;
  updateDocumentStatus(id: string, status: RegisteredDocument['status']): Promise<void>;
}

class FirestoreDocumentCenterRepository implements DocumentCenterRepository {
  async registerDocument(docData: RegisteredDocument): Promise<void> {
    const docId = docData.id || docData.documentId;
    const docRef = doc(db, 'document_center', docId);
    await setDoc(docRef, {
      ...docData,
      id: docId,
      createdAt: new Date().toISOString(),
    });
  }

  async getDocumentById(id: string): Promise<RegisteredDocument | null> {
    const docRef = doc(db, 'document_center', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as RegisteredDocument;
    }
    return null;
  }

  async getDocuments(filters?: DocumentFilterOptions): Promise<RegisteredDocument[]> {
    try {
      const colRef = collection(db, 'document_center');
      const snap = await getDocs(query(colRef, orderBy('generatedOn', 'desc')));
      let list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RegisteredDocument, 'id'>) }));

      if (filters?.module) {
        list = list.filter((d) => d.module === filters.module);
      }
      if (filters?.documentType) {
        list = list.filter((d) => d.documentType.toLowerCase() === filters.documentType?.toLowerCase());
      }
      if (filters?.employeeId) {
        list = list.filter((d) => d.employeeId === filters.employeeId);
      }
      if (filters?.candidateId) {
        list = list.filter((d) => d.candidateId === filters.candidateId);
      }
      if (filters?.clientId) {
        list = list.filter((d) => d.clientId === filters.clientId);
      }
      if (filters?.status) {
        list = list.filter((d) => d.status === filters.status);
      }
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        list = list.filter(
          (d) =>
            d.documentId.toLowerCase().includes(term) ||
            d.documentType.toLowerCase().includes(term) ||
            d.generatedByName.toLowerCase().includes(term)
        );
      }

      return list;
    } catch {
      return [];
    }
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const docRef = doc(db, 'document_center', id);
    const current = await this.getDocumentById(id);
    if (current) {
      await updateDoc(docRef, {
        downloadCount: (current.downloadCount || 0) + 1,
      });
    }
  }

  async updateDocumentStatus(id: string, status: RegisteredDocument['status']): Promise<void> {
    const docRef = doc(db, 'document_center', id);
    await updateDoc(docRef, { status });
  }
}

export const documentCenterRepository: DocumentCenterRepository = new FirestoreDocumentCenterRepository();
