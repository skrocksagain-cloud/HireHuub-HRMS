import { documentCenterRepository } from './repositories/documentCenterRepository';
import type { Document } from '../../types/Document';

export interface DocumentRecord extends Document {
  createdAt?: unknown;
  updatedAt?: unknown;
}

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

export const documentService: DocumentMetadataService = {
  async create(documentData): Promise<string> {
    const saved = await documentCenterRepository.saveDocument(documentData as unknown as DocumentRecord);
    return saved.id || '';
  },

  async update(id, documentData) {
    const existing = await documentCenterRepository.getDocumentById(id);
    if (existing) {
      await documentCenterRepository.saveDocument({
        ...(existing as unknown as DocumentRecord),
        ...documentData,
        id,
      });
    }
  },

  async getById(id) {
    const docItem = await documentCenterRepository.getDocumentById(id);
    return (docItem as unknown as Document) || null;
  },

  async getByDocumentId(documentId) {
    const list = await documentCenterRepository.getDocuments();
    const found = list.find((d) => d.documentId === documentId);
    return (found as unknown as Document) || null;
  },

  async getAll() {
    const list = await documentCenterRepository.getDocuments();
    return list as unknown as Document[];
  },

  async getByModule(module) {
    const list = await documentCenterRepository.getDocuments();
    return list.filter((d) => (d.module as string) === module) as unknown as Document[];
  },

  async getByReference(referenceId) {
    const list = await documentCenterRepository.getDocuments();
    return list.filter((d) => (d as unknown as { referenceId?: string }).referenceId === referenceId) as unknown as Document[];
  },

  async archive(id) {
    const existing = await documentCenterRepository.getDocumentById(id);
    if (existing) {
      await documentCenterRepository.saveDocument({
        ...(existing as unknown as DocumentRecord),
        id,
        archived: true,
        status: 'Archived',
      });
    }
  },

  async assign(id: string, assignedToId: string, sharedWith: string): Promise<void> {
    const existing = await documentCenterRepository.getDocumentById(id);
    if (existing) {
      await documentCenterRepository.saveDocument({
        ...(existing as unknown as DocumentRecord),
        id,
        assignedToId,
        referenceId: assignedToId,
        sharedWith,
      });
    }
  },

  async delete(id) {
    await documentCenterRepository.deleteDocument(id);
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
