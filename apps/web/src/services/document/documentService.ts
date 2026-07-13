import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
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
      const snapshot = await getDocs(query(documentsCollection, orderBy('createdAt', 'desc')));

      return snapshot.docs.map((item) => toDocument(item.id, item.data()));
    } catch (error) {
      throw createDocumentError('fetch all', error);
    }
  },

  async getByModule(module) {
    try {
      const snapshot = await getDocs(
        query(documentsCollection, where('module', '==', module), orderBy('createdAt', 'desc')),
      );

      return snapshot.docs.map((item) => toDocument(item.id, item.data()));
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
          orderBy('version', 'desc'),
        ),
      );

      return snapshot.docs.map((item) => toDocument(item.id, item.data()));
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
export const deleteDocument = documentService.delete;
