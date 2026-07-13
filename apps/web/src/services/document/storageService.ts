import {
  deleteObject,
  getBlob,
  getDownloadURL,
  getMetadata,
  ref,
  uploadBytes,
} from 'firebase/storage';

import { storage } from '../../firebase/firebase';

export interface UploadFileResult {
  storagePath: string;
  downloadUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface DocumentStorage {
  upload(file: Blob, storagePath: string): Promise<UploadFileResult>;
  download(storagePath: string): Promise<Blob>;
  delete(storagePath: string): Promise<void>;
  getDownloadUrl(storagePath: string): Promise<string>;
  exists(storagePath: string): Promise<boolean>;
}

const getStorageReference = (storagePath: string) => {
  if (!storagePath.trim()) {
    throw new Error('A non-empty storage path is required.');
  }

  return ref(storage, storagePath);
};

const isStorageError = (error: unknown, code: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === code;

const createStorageError = (operation: string, storagePath: string, error: unknown): Error => {
  const detail = error instanceof Error ? ` ${error.message}` : '';

  return new Error(`Unable to ${operation} storage path "${storagePath}".${detail}`);
};

export const storageService: DocumentStorage = {
  async upload(file, storagePath) {
    try {
      const storageReference = getStorageReference(storagePath);
      const snapshot = await uploadBytes(storageReference, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      return {
        storagePath,
        downloadUrl,
        fileSize: snapshot.metadata.size,
        mimeType: snapshot.metadata.contentType ?? 'application/octet-stream',
      };
    } catch (error) {
      throw createStorageError('upload', storagePath, error);
    }
  },

  async download(storagePath) {
    try {
      return await getBlob(getStorageReference(storagePath));
    } catch (error) {
      throw createStorageError('download', storagePath, error);
    }
  },

  async delete(storagePath) {
    try {
      await deleteObject(getStorageReference(storagePath));
    } catch (error) {
      throw createStorageError('delete', storagePath, error);
    }
  },

  async getDownloadUrl(storagePath) {
    try {
      return await getDownloadURL(getStorageReference(storagePath));
    } catch (error) {
      throw createStorageError('get a download URL for', storagePath, error);
    }
  },

  async exists(storagePath) {
    try {
      await getMetadata(getStorageReference(storagePath));
      return true;
    } catch (error) {
      if (isStorageError(error, 'storage/object-not-found')) {
        return false;
      }

      throw createStorageError('check', storagePath, error);
    }
  },
};
