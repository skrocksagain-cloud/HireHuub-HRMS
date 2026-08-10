import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../../firebase/firebase';
import type { CalendarAttachmentMetadata } from '../../../types/Calendar';

export class CalendarStorageRepository {
  async uploadAttachment(
    file: File,
    meetingId: string,
    uploadedBy: string,
    uploadedByName?: string
  ): Promise<CalendarAttachmentMetadata> {
    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `calendar_attachments/${meetingId || Date.now()}/${cleanFileName}`;

    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      fileName: cleanFileName,
      originalFileName: file.name,
      storagePath,
      downloadURL,
      uploadedBy,
      uploadedByName: uploadedByName || 'Organizer',
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      fileType: ext,
    };
  }
}

export const calendarStorageRepository = new CalendarStorageRepository();
