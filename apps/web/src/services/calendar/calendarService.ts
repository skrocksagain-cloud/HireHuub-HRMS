import { calendarRepository } from './repositories/calendarRepository';
import { calendarStorageRepository } from './repositories/calendarStorageRepository';
import { adminAuditLogRepository } from '../auth/repositories/adminAuditLogRepository';
import { employeeRepository } from '../../pages/Employee/repositories/employeeRepository';

import type {
  CalendarAttachmentMetadata,
  CalendarEventItem,
  CalendarInvitationItem,
  HolidayItem,
} from '../../types/Calendar';
import type { HierarchyNode, any } from '../../types/Admin';
import { resolveAudienceEmployeeIds } from '../audience/audienceService';

export interface AvailabilityWarning {
  employeeId: string;
  employeeName: string;
  reason: string;
}

class CalendarService {
  /**
   * Fetch Active Employees ONLY (status == 'Active') from employeeRepository
   */
  async getActiveEmployees(): Promise<HierarchyNode[]> {
    const list = await employeeRepository.getEmployees();
    const activeOnly = list.filter(
      (e) => (e.status === 'Active' || e.employmentStatus === 'Active') &&
             e.status !== 'Inactive' && e.employmentStatus !== 'Terminated' && e.employmentStatus !== 'Notice Period'
    );

    return activeOnly.map((e) => ({
      id: e.id || e.employeeId || '',
      employeeId: e.employeeId || e.id || '',
      employeeName: e.fullName || `${e.firstName} ${e.lastName}`.trim(),
      designation: e.designation || 'Staff',
      departmentId: e.department || 'general',
      departmentName: e.department || 'General',
      reportingToId: e.reportingManagerId || '',
      reportingToName: e.reportingManager || '',
      status: 'Active',
    }));
  }

  /**
   * Fetch Events filtered by Permission Engine and Role Scope
   */
  async getEvents(role?: any | string, userId?: string): Promise<CalendarEventItem[]> {
    const active = true;
    const events = await calendarRepository.getEvents();

    if (['Super Admin', 'Super_Admin'].includes(active?.assignedRole || active?.role || active?.name || '')) {
      return events;
    }

    return events.filter((evt) => {
      if (evt.visibility === 'Organization' || evt.visibility === 'Company') return true;
      if (evt.visibility === 'Department' && active.departmentScope?.some((d) => evt.departmentIds?.includes(d))) return true;
      if (evt.invitedEmployeeIds?.includes(userId || '')) return true;
      if (evt.organizerId === userId) return true;
      return false;
    });
  }

  /**
   * Upload Meeting Attachment File
   */
  async uploadAttachment(
    file: File,
    meetingId: string,
    uploadedBy: string,
    uploadedByName?: string
  ): Promise<CalendarAttachmentMetadata> {
    const meta = await calendarStorageRepository.uploadAttachment(file, meetingId, uploadedBy, uploadedByName);

    await adminAuditLogRepository.createAdminAuditLog({
      actorId: uploadedBy,
      actorName: uploadedByName || 'Organizer',
      action: 'UNLOCK_APPROVE',
      targetEmployeeId: meetingId,
      targetEmployeeName: meta.fileName,
      reason: `Uploaded meeting attachment ${meta.fileName} (${meta.fileType})`,
      status: 'EXECUTED',
      timestamp: new Date().toISOString(),
    });

    return meta;
  }

  /**
   * Save or Update Calendar Event
   */
  async saveEvent(
    eventData: Omit<CalendarEventItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: string },
    actorRole?: any | string,
    actorId = 'admin',
    actorName = 'Super Admin'
  ): Promise<CalendarEventItem> {
    const activeRole = true;

    // Enforce Dept Admin Restriction
    if (!['Super Admin', 'Super_Admin'].includes(activeRole?.assignedRole || activeRole?.role || activeRole?.name || '') && eventData.visibility === 'Organization') {
      throw new Error('Department Admins cannot schedule Organization-wide meetings. Please restrict visibility to your department or team.');
    }

    const now = new Date().toISOString();

    // Dynamically resolve target audience employee IDs using shared audienceService
    const targetInvitedEmployeeIds = await resolveAudienceEmployeeIds({
      visibility: eventData.visibility,
      departmentIds: eventData.departmentIds,
      teamIds: eventData.teamIds,
      selectedEmployeeIds: eventData.invitedEmployeeIds,
    });

    const savedEvent = await calendarRepository.saveEvent({
      ...eventData,
      invitedEmployeeIds: targetInvitedEmployeeIds,
      createdAt: eventData.createdAt || now,
      updatedAt: now,
    });

    // Dispatch Notifications to all target active employees
    if (savedEvent.invitedEmployeeIds && savedEvent.invitedEmployeeIds.length > 0) {
      for (const empId of savedEvent.invitedEmployeeIds) {
        if (!empId) continue;
        await calendarRepository.createNotification({
          userId: empId,
          eventId: savedEvent.id,
          title: `New Meeting Invitation: ${savedEvent.title}`,
          message: `${actorName} invited you to ${savedEvent.title} on ${savedEvent.date} at ${savedEvent.startTime}`,
          category: 'Meeting',
          isRead: false,
          createdAt: now,
        });

        // Initialize Invitation record if new
        await calendarRepository.saveInvitation({
          eventId: savedEvent.id,
          employeeId: empId,
          employeeName: 'Invited Employee',
          responseStatus: 'Pending',
        });
      }
    }

    // Audit Log
    await adminAuditLogRepository.createAdminAuditLog({
      actorId,
      actorName,
      action: eventData.id ? 'UNLOCK_OVERRIDE' : 'UNLOCK_APPROVE',
      targetEmployeeId: savedEvent.id,
      targetEmployeeName: savedEvent.title,
      reason: `${eventData.id ? 'Updated' : 'Created'} meeting '${savedEvent.title}'`,
      status: 'EXECUTED',
      timestamp: now,
    });

    return savedEvent;
  }

  /**
   * Delete Calendar Event
   */
  async deleteEvent(eventId: string, actorId = 'admin', actorName = 'Super Admin'): Promise<void> {
    await calendarRepository.deleteEvent(eventId);
    await adminAuditLogRepository.createAdminAuditLog({
      actorId,
      actorName,
      action: 'UNLOCK_REJECT',
      targetEmployeeId: eventId,
      targetEmployeeName: 'Meeting Cancellation',
      reason: `Cancelled meeting record ${eventId}`,
      status: 'EXECUTED',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check invited employee availability
   */
  async checkEmployeeAvailability(
    invitedIds: string[],
    date: string,
    startTime: string,
    _endTime: string
  ): Promise<AvailabilityWarning[]> {
    const warnings: AvailabilityWarning[] = [];
    const events = await calendarRepository.getEvents();
    const activeEmployees = await this.getActiveEmployees();

    for (const empId of invitedIds) {
      const emp = activeEmployees.find((e) => e.employeeId === empId);
      const empName = emp ? emp.employeeName : empId;

      const conflicting = events.find(
        (evt) =>
          evt.date === date &&
          evt.startTime === startTime &&
          evt.invitedEmployeeIds?.includes(empId)
      );

      if (conflicting) {
        warnings.push({
          employeeId: empId,
          employeeName: empName,
          reason: `Already scheduled for '${conflicting.title}' at ${startTime}`,
        });
      }
    }

    return warnings;
  }

  /**
   * Save Invitation Response (Accept / Maybe / Decline)
   */
  async respondToInvitation(
    eventId: string,
    employeeId: string,
    employeeName: string,
    responseStatus: 'Accepted' | 'Maybe' | 'Declined',
    notes?: string
  ): Promise<void> {
    await calendarRepository.saveInvitation({
      eventId,
      employeeId,
      employeeName,
      responseStatus,
      respondedAt: new Date().toISOString(),
      notes,
    });

    await adminAuditLogRepository.createAdminAuditLog({
      actorId: employeeId,
      actorName: employeeName,
      action: 'UNLOCK_APPROVE',
      targetEmployeeId: eventId,
      targetEmployeeName: `Meeting Response: ${responseStatus}`,
      reason: `Employee ${employeeName} responded '${responseStatus}' to meeting.`,
      status: 'EXECUTED',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Save Organization Holiday (Super Admin Only)
   */
  async saveHoliday(
    holiday: Omit<HolidayItem, 'id' | 'createdAt'>,
    actorRole?: any | string,
    actorId = 'admin',
    actorName = 'Super Admin'
  ): Promise<HolidayItem> {
    const activeRole = true;

    if (!['Super Admin', 'Super_Admin'].includes(activeRole?.assignedRole || activeRole?.role || activeRole?.name || '')) {
      throw new Error('Only Super Admin can create Organization Holidays.');
    }

    const now = new Date().toISOString();
    const saved = await calendarRepository.saveHoliday({
      ...holiday,
      createdAt: now,
    });

    // Notify all users of new Holiday
    await calendarRepository.createNotification({
      userId: 'ALL',
      eventId: saved.id,
      title: `New Organization Holiday: ${saved.name}`,
      message: `${saved.name} declared on ${saved.date}`,
      category: 'Holiday',
      isRead: false,
      createdAt: now,
    });

    await adminAuditLogRepository.createAdminAuditLog({
      actorId,
      actorName,
      action: 'UNLOCK_APPROVE',
      targetEmployeeId: saved.id,
      targetEmployeeName: saved.name,
      reason: `Created Organization Holiday '${saved.name}' on ${saved.date}`,
      status: 'EXECUTED',
      timestamp: now,
    });

    return saved;
  }

  /**
   * Get Holidays
   */
  async getHolidays(): Promise<HolidayItem[]> {
    return calendarRepository.getHolidays();
  }

  /**
   * Get Invitations for Meeting
   */
  async getInvitations(eventId: string): Promise<CalendarInvitationItem[]> {
    return calendarRepository.getInvitations(eventId);
  }
}

export const calendarService = new CalendarService();
