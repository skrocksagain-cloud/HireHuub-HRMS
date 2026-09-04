export type AnnouncementCategory =
  | 'HR Policy'
  | 'Finance'
  | 'Payroll'
  | 'Recruitment'
  | 'Staffing'
  | 'Marketing'
  | 'IT'
  | 'Operations'
  | 'Training'
  | 'Compliance'
  | 'Emergency'
  | 'General';

export type AnnouncementVisibilityScope =
  | 'Organization'
  | 'Company'
  | 'Department'
  | 'Team'
  | 'Selected Employees'
  | 'Private';

export type AnnouncementPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type AnnouncementStatus =
  | 'Draft'
  | 'Submitted for Approval'
  | 'Approved'
  | 'Scheduled'
  | 'Published'
  | 'Archived'
  | 'Expired';

export interface CircularFileMetadata {
  fileName: string;
  originalFileName: string;
  storagePath: string;
  downloadURL: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: string;
  fileSize: number;
  fileType: 'PDF' | 'DOCX' | string;
}

export interface AnnouncementVersion {
  id?: string;
  announcementId: string;
  versionNumber: string; // e.g. '1.0', '1.1'
  title: string;
  summary: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  editedBy: string;
  editedByName: string;
  editedAt: string;
  changeSummary: string;
  previousAttachment?: CircularFileMetadata | null;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  summary: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  visibility: AnnouncementVisibilityScope;
  companyIds?: string[];
  departmentIds?: string[];
  teamIds?: string[];
  employeeIds?: string[];
  circularMetadata?: CircularFileMetadata | null;
  requireAcknowledgement?: boolean;
  isPinned?: boolean;
  version: string; // e.g. '1.0'
  publishDate: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  isArchived: boolean;
  publishedBy: string;
  publishedByName: string;
  submittedBy?: string;
  submittedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementReadRecord {
  id: string;
  announcementId: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  device?: string;
  deliveredAt: string;
  viewedAt?: string;
  downloadedAt?: string;
  acknowledgedAt?: string;
}

export interface AnnouncementNotification {
  id?: string;
  announcementId: string;
  targetEmployeeId: string;
  title: string;
  summary: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  createdAt: string;
  isRead: boolean;
}
