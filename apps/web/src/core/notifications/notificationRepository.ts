import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '../../firebase/firebase';
import type { NotificationEntry } from './notificationService';

export interface NotificationRepository {
  create(entry: NotificationEntry): Promise<void>;
}

class FirestoreNotificationRepository implements NotificationRepository {
  async create(entry: NotificationEntry): Promise<void> {
    await addDoc(collection(db, 'notifications'), { ...entry, isRead: false, createdAt: serverTimestamp() });
  }
}

export const notificationRepository: NotificationRepository = new FirestoreNotificationRepository();
