import type { OpeningAttachment } from '../../../../types/Opening';

export interface IAttachmentStorageService {
  uploadAttachment(file: File, openingId: string): Promise<OpeningAttachment>;
  deleteAttachment(attachmentId: string): Promise<boolean>;
}

export class AttachmentStorageService implements IAttachmentStorageService {
  async uploadAttachment(_file: File, _openingId: string): Promise<OpeningAttachment> {
    // Extension Point: Future Firebase Storage / Cloud Storage integration
    throw new Error('AttachmentStorageService.uploadAttachment is an extension point contract and not yet implemented.');
  }

  async deleteAttachment(_attachmentId: string): Promise<boolean> {
    // Extension Point: Future attachment deletion implementation
    throw new Error('AttachmentStorageService.deleteAttachment is an extension point contract and not yet implemented.');
  }
}

export const attachmentStorageService = new AttachmentStorageService();
