import type { DocumentFilterOptions, RegisteredDocument } from '../../types/DocumentCenter';
import { documentCenterRepository } from './repositories/documentCenterRepository';

class DocumentCenterService {
  async registerDocument(docData: RegisteredDocument): Promise<void> {
    await documentCenterRepository.registerDocument(docData);
  }

  async getDocumentById(id: string): Promise<RegisteredDocument | null> {
    return documentCenterRepository.getDocumentById(id);
  }

  async getDocuments(filters?: DocumentFilterOptions): Promise<RegisteredDocument[]> {
    return documentCenterRepository.getDocuments(filters);
  }

  async recordDownload(id: string): Promise<void> {
    await documentCenterRepository.incrementDownloadCount(id);
  }

  async updateStatus(id: string, status: RegisteredDocument['status']): Promise<void> {
    await documentCenterRepository.updateDocumentStatus(id, status);
  }
}

export const documentCenterService = new DocumentCenterService();
