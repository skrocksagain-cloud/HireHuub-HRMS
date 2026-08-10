import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../../firebase/firebase';
import type { CircularFileMetadata } from '../../../types/Announcement';

export class AnnouncementStorageRepository {
  async uploadCircularFile(
    file: File,
    uploadedBy: string,
    uploadedByName?: string
  ): Promise<CircularFileMetadata> {
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const fileType = ext === 'DOCX' || ext === 'DOC' ? 'DOCX' : 'PDF';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `announcements/${Date.now()}_${cleanFileName}`;

    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      fileName: cleanFileName,
      originalFileName: file.name,
      storagePath,
      downloadURL,
      uploadedBy,
      uploadedByName: uploadedByName || 'Admin',
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      fileType,
    };
  }
}

export const announcementStorageRepository = new AnnouncementStorageRepository();
