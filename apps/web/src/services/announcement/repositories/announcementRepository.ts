import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import type {
  AnnouncementItem,
  AnnouncementNotification,
  AnnouncementReadRecord,
} from '../../../types/Announcement';

const ANNOUNCEMENTS_COLLECTION = 'admin_announcements';
const READS_COLLECTION = 'announcement_reads';
const NOTIFICATIONS_COLLECTION = 'announcement_notifications';

class AnnouncementRepository {
  /**
   * Fetch all announcements from Firestore
   */
  async getAnnouncements(): Promise<AnnouncementItem[]> {
    try {
      const snap = await getDocs(collection(db, ANNOUNCEMENTS_COLLECTION));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AnnouncementItem, 'id'>) }));
    } catch {
      return [];
    }
  }

  /**
   * Save or Update Announcement Document
   */
  async saveAnnouncement(ann: Omit<AnnouncementItem, 'id'> & { id?: string }): Promise<AnnouncementItem> {
    const annId = ann.id || `ann_${Date.now()}`;
    const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, annId);
    const now = new Date().toISOString();

    const payload: AnnouncementItem = {
      ...ann,
      id: annId,
      createdAt: ann.createdAt || now,
      updatedAt: now,
    };

    await setDoc(docRef, payload, { merge: true });
    return payload;
  }

  /**
   * Delete Announcement Document
   */
  async deleteAnnouncement(annId: string): Promise<void> {
    await deleteDoc(doc(db, ANNOUNCEMENTS_COLLECTION, annId));
  }

  /**
   * Archive Announcement
   */
  async archiveAnnouncement(annId: string): Promise<void> {
    await updateDoc(doc(db, ANNOUNCEMENTS_COLLECTION, annId), {
      isArchived: true,
      status: 'Archived',
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Fetch Read Tracking Records for an Announcement
   */
  async getReadRecords(announcementId: string): Promise<AnnouncementReadRecord[]> {
    try {
      const q = query(collection(db, READS_COLLECTION), where('announcementId', '==', announcementId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AnnouncementReadRecord, 'id'>) }));
    } catch {
      return [];
    }
  }

  /**
   * Record Read / Download / Acknowledgement
   */
  async recordReadStatus(record: Omit<AnnouncementReadRecord, 'id'>): Promise<void> {
    try {
      const recId = `${record.announcementId}_${record.employeeId}`;
      const docRef = doc(db, READS_COLLECTION, recId);
      await setDoc(docRef, { ...record, id: recId }, { merge: true });
    } catch {
      // Ignore fallback errors
    }
  }

  /**
   * Create Notifications for Target Employees
   */
  async createNotifications(notifications: Omit<AnnouncementNotification, 'id'>[]): Promise<void> {
    try {
      await Promise.all(
        notifications.map((notif) => addDoc(collection(db, NOTIFICATIONS_COLLECTION), notif))
      );
    } catch {
      // Ignore fallback
    }
  }
}

export const announcementRepository = new AnnouncementRepository();
