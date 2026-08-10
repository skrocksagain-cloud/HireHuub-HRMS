import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import type { AnnouncementVersion } from '../../../types/Announcement';

const VERSIONS_COLLECTION = 'announcement_versions';

export class AnnouncementVersionRepository {
  async saveVersion(version: Omit<AnnouncementVersion, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, VERSIONS_COLLECTION), {
      ...version,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async getVersions(announcementId: string): Promise<AnnouncementVersion[]> {
    try {
      const q = query(collection(db, VERSIONS_COLLECTION), where('announcementId', '==', announcementId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AnnouncementVersion, 'id'>) }));
      return list.sort((a, b) => b.editedAt.localeCompare(a.editedAt));
    } catch {
      return [];
    }
  }
}

export const announcementVersionRepository = new AnnouncementVersionRepository();
