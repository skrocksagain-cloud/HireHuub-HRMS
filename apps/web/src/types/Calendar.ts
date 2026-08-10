export type CalendarEventType =
  | 'Review Meeting'
  | 'Planning Meeting'
  | 'Discussion'
  | 'Team Meeting'
  | 'Client Meeting'
  | 'Interview'
  | 'Training'
  | 'Holiday'
  | 'Birthday'
  | 'Work Anniversary'
  | 'Reminder'
  | 'Other';

export type EventVisibilityScope =
  | 'Organization'
  | 'Company'
  | 'Branch'
  | 'Department'
  | 'Multiple Departments'
  | 'Team'
  | 'Multiple Teams'
  | 'Selected Employees'
  | 'Private';

export type MeetingResponseStatus = 'Pending' | 'Accepted' | 'Maybe' | 'Declined';

export type EventApprovalStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';

export type EventRecurrenceType = 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom';

export interface CalendarAttachmentMetadata {
  fileName: string;
  originalFileName: string;
  storagePath: string;
  downloadURL: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: string;
  fileSize: number;
  fileType: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'JPG' | 'PNG' | string;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startTime: string;
  endTime: string;
  date: string; // YYYY-MM-DD
  location?: string;
  meetingLink?: string;
  visibility: EventVisibilityScope;
  companyIds?: string[];
  departmentIds?: string[];
  teamIds?: string[];
  invitedEmployeeIds: string[];
  organizerId: string;
  organizerName: string;
  organizerEmail?: string;
  organizerDepartment?: string;
  organizerDesignation?: string;
  approvalStatus: EventApprovalStatus;
  recurrence: EventRecurrenceType;
  colorCode?: string;
  attachmentUrls?: string[];
  attachmentMetadata?: CalendarAttachmentMetadata[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarInvitationItem {
  id: string;
  eventId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  responseStatus: MeetingResponseStatus;
  respondedAt?: string;
  notes?: string;
}

export interface HolidayItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  description?: string;
  companyId?: string;
  branchId?: string;
  state?: string;
  createdAt: string;
}

export interface CalendarNotificationItem {
  id: string;
  userId: string;
  eventId: string;
  title: string;
  message: string;
  category: 'Meeting' | 'Reminder' | 'Holiday' | 'Birthday' | 'Anniversary';
  isRead: boolean;
  createdAt: string;
}
