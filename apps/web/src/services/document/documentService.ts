import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../../firebase/firebase';
import type { Document } from '../../types/Document';

const COLLECTION_NAME = 'documents';

export interface DocumentMetadataService {
  create(documentData: Document): Promise<string>;
  update(id: string, documentData: Partial<Document>): Promise<void>;
  getById(id: string): Promise<Document | null>;
  getByDocumentId(documentId: string): Promise<Document | null>;
  getAll(): Promise<Document[]>;
  getByModule(module: Document['module']): Promise<Document[]>;
  getByReference(referenceId: string): Promise<Document[]>;
  archive(id: string): Promise<void>;
  assign(id: string, assignedToId: string, sharedWith: string): Promise<void>;
  delete(id: string): Promise<void>;
}

const documentsCollection = collection(db, COLLECTION_NAME);

const toDocument = (id: string, data: unknown): Document => ({
  id,
  ...(data as Document),
});

const createDocumentError = (operation: string, error: unknown): Error => {
  const detail = error instanceof Error ? ` ${error.message}` : '';

  return new Error(`Unable to ${operation} document metadata.${detail}`);
};

const requireIdentifier = (value: string, label: string): string => {
  if (!value.trim()) {
    throw new Error(`${label} is required.`);
  }

  return value;
};

const getMillis = (value: unknown): number => {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
};

export const documentService: DocumentMetadataService = {
  async create(documentData) {
    try {
      const documentReference = await addDoc(documentsCollection, {
        ...documentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return documentReference.id;
    } catch (error) {
      throw createDocumentError('create', error);
    }
  },

  async update(id, documentData) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, requireIdentifier(id, 'Document ID')), {
        ...documentData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw createDocumentError('update', error);
    }
  },

  async getById(id) {
    try {
      const snapshot = await getDoc(doc(db, COLLECTION_NAME, requireIdentifier(id, 'Document ID')));

      return snapshot.exists() ? toDocument(snapshot.id, snapshot.data()) : null;
    } catch (error) {
      throw createDocumentError('fetch', error);
    }
  },

  async getByDocumentId(documentId) {
    try {
      const documentsQuery = query(
        documentsCollection,
        where('documentId', '==', requireIdentifier(documentId, 'Document number')),
      );
      const snapshot = await getDocs(documentsQuery);
      const firstDocument = snapshot.docs[0];

      return firstDocument ? toDocument(firstDocument.id, firstDocument.data()) : null;
    } catch (error) {
      throw createDocumentError('fetch', error);
    }
  },

  async getAll() {
    try {
      const snapshot = await getDocs(documentsCollection);
      const docs = snapshot.docs.map((item) => toDocument(item.id, item.data()));
      return docs.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
    } catch (error) {
      throw createDocumentError('fetch all', error);
    }
  },

  async getByModule(module) {
    try {
      const snapshot = await getDocs(
        query(documentsCollection, where('module', '==', module)),
      );
      const docs = snapshot.docs.map((item) => toDocument(item.id, item.data()));
      return docs.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
    } catch (error) {
      throw createDocumentError('fetch by module', error);
    }
  },

  async getByReference(referenceId) {
    try {
      const snapshot = await getDocs(
        query(
          documentsCollection,
          where('referenceId', '==', requireIdentifier(referenceId, 'Reference ID')),
        ),
      );
      const docs = snapshot.docs.map((item) => toDocument(item.id, item.data()));
      return docs.sort((a, b) => (b.version ?? 1) - (a.version ?? 1));
    } catch (error) {
      throw createDocumentError('fetch by reference', error);
    }
  },

  async archive(id) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, requireIdentifier(id, 'Document ID')), {
        archived: true,
        status: 'Archived',
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw createDocumentError('archive', error);
    }
  },

  async assign(id: string, assignedToId: string, sharedWith: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, requireIdentifier(id, 'Document ID')), {
        assignedToId,
        referenceId: assignedToId,
        sharedWith,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw createDocumentError('assign', error);
    }
  },

  async delete(id) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, requireIdentifier(id, 'Document ID')));
    } catch (error) {
      throw createDocumentError('delete', error);
    }
  },
};

export const createDocument = documentService.create;
export const updateDocument = documentService.update;
export const getDocumentById = documentService.getById;
export const getDocumentByNumber = documentService.getByDocumentId;
export const getDocuments = documentService.getAll;
export const getDocumentsByModule = documentService.getByModule;
export const getDocumentsByReference = documentService.getByReference;
export const archiveDocument = documentService.archive;
export const assignDocument = documentService.assign;
export const deleteDocument = documentService.delete;
