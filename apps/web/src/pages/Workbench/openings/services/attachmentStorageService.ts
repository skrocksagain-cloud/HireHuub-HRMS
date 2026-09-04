/* eslint-disable */
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../../../firebase/firebase';
import type { OpeningAttachment } from '../../../../types/Opening';

export interface IAttachmentStorageService {
  uploadAttachment(file: File, openingId: string): Promise<OpeningAttachment>;
  deleteAttachment(storagePath: string): Promise<boolean>;
}

export class AttachmentStorageService implements IAttachmentStorageService {
  async uploadAttachment(file: File, openingId = 'general'): Promise<OpeningAttachment> {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `openings/${openingId}/${timestamp}_${cleanFileName}`;

    let fileUrl = '';
    try {
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      fileUrl = await getDownloadURL(storageRef);
    } catch {
      // Offline fallback: persistent Data URL for storage
      fileUrl = await this.fileToDataUrl(file);
    }

    return {
      id: `att-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      fileUrl: fileUrl || (await this.fileToDataUrl(file)),
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    };
  }

  async deleteAttachment(storagePath: string): Promise<boolean> {
    if (!storagePath) return true;
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      return true;
    } catch {
      return false;
    }
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
}

export const attachmentStorageService = new AttachmentStorageService();

