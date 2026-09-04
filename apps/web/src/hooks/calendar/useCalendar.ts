import { useCallback, useEffect, useState } from 'react';
import { calendarService, type AvailabilityWarning } from '../../services/calendar/calendarService';
import { calendarRepository } from '../../services/calendar/repositories/calendarRepository';
import type {
  CalendarAttachmentMetadata,
  CalendarEventItem,
  CalendarInvitationItem,
  HolidayItem,
} from '../../types/Calendar';
import type { HierarchyNode } from '../../types/Admin';
import { usePermissions } from '../usePermissions';

export function useCalendar(currentUserId = 'HH0001', currentUserName = 'Somnath') {
  const { activeRole } = usePermissions();

  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<HierarchyNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  // Fetch initial active employees list
  const fetchActiveEmployees = useCallback(async () => {
    try {
      const emps = await calendarService.getActiveEmployees();
      setActiveEmployees(emps);
    } catch {
      setActiveEmployees([]);
    }
  }, []);

  useEffect(() => {
    fetchActiveEmployees();
  }, [fetchActiveEmployees]);

  // Realtime Firestore onSnapshot listener for Calendar Events
  useEffect(() => {
    setIsLoading(true);
    const unsubscribeEvents = calendarRepository.subscribeToEvents((updatedList) => {
      // Filter events by permission scope
      calendarService.getEvents(activeRole, currentUserId).then(() => {
        setEvents(updatedList);
        setIsLoading(false);
      }).catch(() => {
        setEvents(updatedList);
        setIsLoading(false);
      });
    });

    const unsubscribeHolidays = calendarRepository.subscribeToHolidays((updatedHols) => {
      setHolidays(updatedHols);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeHolidays();
    };
  }, [activeRole.name, currentUserId]);

  const uploadAttachment = async (file: File, meetingId: string): Promise<CalendarAttachmentMetadata> => {
    setIsUploading(true);
    try {
      const meta = await calendarService.uploadAttachment(file, meetingId, currentUserId, currentUserName);
      setIsUploading(false);
      return meta;
    } catch (err) {
      setIsUploading(false);
      throw err;
    }
  };

  const saveEvent = async (
    eventData: Omit<CalendarEventItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    const saved = await calendarService.saveEvent(eventData, activeRole, currentUserId, currentUserName);
    setStatusMsg(`Meeting '${saved.title}' saved successfully! Notifications sent to attendees.`);
    setTimeout(() => setStatusMsg(''), 4000);
    return saved;
  };

  const deleteEvent = async (eventId: string) => {
    await calendarService.deleteEvent(eventId, currentUserId, currentUserName);
    setStatusMsg(`Meeting cancelled and removed.`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const checkAvailability = async (
    invitedIds: string[],
    date: string,
    startTime: string,
    endTime: string
  ): Promise<AvailabilityWarning[]> => {
    return calendarService.checkEmployeeAvailability(invitedIds, date, startTime, endTime);
  };

  const respondToInvite = async (
    eventId: string,
    responseStatus: 'Accepted' | 'Maybe' | 'Declined',
    notes?: string
  ) => {
    await calendarService.respondToInvitation(eventId, currentUserId, currentUserName, responseStatus, notes);
    setStatusMsg(`Response '${responseStatus}' recorded.`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const saveHoliday = async (holiday: Omit<HolidayItem, 'id' | 'createdAt'>) => {
    const saved = await calendarService.saveHoliday(holiday, activeRole, currentUserId, currentUserName);
    setStatusMsg(`Organization Holiday '${saved.name}' added successfully!`);
    setTimeout(() => setStatusMsg(''), 4000);
    return saved;
  };

  const getInvitations = async (eventId: string): Promise<CalendarInvitationItem[]> => {
    return calendarService.getInvitations(eventId);
  };

  return {
    events,
    holidays,
    activeEmployees,
    isLoading,
    isUploading,
    statusMsg,
    uploadAttachment,
    saveEvent,
    deleteEvent,
    checkAvailability,
    respondToInvite,
    saveHoliday,
    getInvitations,
  };
}
