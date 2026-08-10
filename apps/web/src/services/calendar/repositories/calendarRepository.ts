import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import type {
  CalendarEventItem,
  CalendarInvitationItem,
  CalendarNotificationItem,
  HolidayItem,
} from '../../../types/Calendar';

const EVENTS_COLLECTION = 'admin_calendar_events';
const INVITATIONS_COLLECTION = 'calendar_invitations';
const HOLIDAYS_COLLECTION = 'admin_holidays';
const CALENDAR_NOTIFS_COLLECTION = 'calendar_notifications';
const ADMIN_NOTIFS_COLLECTION = 'admin_notifications';

class CalendarRepository {
  /**
   * Fetch all calendar events (Static fallback)
   */
  async getEvents(): Promise<CalendarEventItem[]> {
    try {
      const snap = await getDocs(collection(db, EVENTS_COLLECTION));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CalendarEventItem, 'id'>) }));
    } catch {
      return [];
    }
  }

  /**
   * Subscribe to Realtime Calendar Events via onSnapshot
   */
  subscribeToEvents(onUpdate: (events: CalendarEventItem[]) => void): Unsubscribe {
    const q = collection(db, EVENTS_COLLECTION);
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CalendarEventItem, 'id'>) }));
        onUpdate(list);
      },
      () => {
        onUpdate([]);
      }
    );
  }

  /**
   * Save or Update Calendar Event
   */
  async saveEvent(event: Omit<CalendarEventItem, 'id'> & { id?: string }): Promise<CalendarEventItem> {
    const eventId = event.id || `evt_${Date.now()}`;
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const now = new Date().toISOString();

    const payload: CalendarEventItem = {
      ...event,
      id: eventId,
      createdAt: event.createdAt || now,
      updatedAt: now,
    };

    await setDoc(docRef, payload, { merge: true });
    return payload;
  }

  /**
   * Delete Calendar Event
   */
  async deleteEvent(eventId: string): Promise<void> {
    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
  }

  /**
   * Fetch Event Invitations
   */
  async getInvitations(eventId: string): Promise<CalendarInvitationItem[]> {
    try {
      const q = query(collection(db, INVITATIONS_COLLECTION), where('eventId', '==', eventId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CalendarInvitationItem, 'id'>) }));
    } catch {
      return [];
    }
  }

  /**
   * Subscribe to Realtime Meeting Invitations
   */
  subscribeToInvitations(eventId: string, onUpdate: (invites: CalendarInvitationItem[]) => void): Unsubscribe {
    const q = query(collection(db, INVITATIONS_COLLECTION), where('eventId', '==', eventId));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CalendarInvitationItem, 'id'>) }));
        onUpdate(list);
      },
      () => {
        onUpdate([]);
      }
    );
  }

  /**
   * Save Invitation Response
   */
  async saveInvitation(invitation: Omit<CalendarInvitationItem, 'id'> & { id?: string }): Promise<void> {
    const invId = invitation.id || `${invitation.eventId}_${invitation.employeeId}`;
    const docRef = doc(db, INVITATIONS_COLLECTION, invId);
    await setDoc(docRef, { ...invitation, id: invId }, { merge: true });
  }

  /**
   * Fetch Holidays
   */
  async getHolidays(): Promise<HolidayItem[]> {
    try {
      const snap = await getDocs(collection(db, HOLIDAYS_COLLECTION));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HolidayItem, 'id'>) }));
    } catch {
      return [];
    }
  }

  /**
   * Subscribe to Realtime Holidays via onSnapshot
   */
  subscribeToHolidays(onUpdate: (holidays: HolidayItem[]) => void): Unsubscribe {
    const q = collection(db, HOLIDAYS_COLLECTION);
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HolidayItem, 'id'>) }));
        onUpdate(list);
      },
      () => {
        onUpdate([]);
      }
    );
  }

  /**
   * Save Holiday
   */
  async saveHoliday(holiday: Omit<HolidayItem, 'id'> & { id?: string }): Promise<HolidayItem> {
    const holId = holiday.id || `hol_${Date.now()}`;
    const docRef = doc(db, HOLIDAYS_COLLECTION, holId);
    const payload: HolidayItem = {
      ...holiday,
      id: holId,
      createdAt: holiday.createdAt || new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    return payload;
  }

  /**
   * Save In-App Calendar Notification
   */
  async createNotification(notif: Omit<CalendarNotificationItem, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, CALENDAR_NOTIFS_COLLECTION), {
        ...notif,
        createdAt: new Date().toISOString(),
      });

      // Also dispatch to central admin_notifications
      await addDoc(collection(db, ADMIN_NOTIFS_COLLECTION), {
        userId: notif.userId,
        title: notif.title,
        message: notif.message,
        category: notif.category === 'Meeting' ? 'Meeting' : notif.category === 'Holiday' ? 'Holiday' : 'Calendar',
        timestamp: new Date().toISOString(),
        isRead: false,
      });
    } catch {
      // Ignore fallback
    }
  }
}

export const calendarRepository = new CalendarRepository();
