import { notificationRepository } from './notificationRepository';

export interface NotificationEntry {
  recipientEmployeeId: string;
  title: string;
  message: string;
  module: string;
  type: 'success' | 'info' | 'warning';
}

class NotificationService {
  async send(entry: NotificationEntry): Promise<void> {
    await notificationRepository.create(entry);
  }
}

export const notificationService = new NotificationService();
