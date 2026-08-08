export type CandidateStatus =
  | 'Active'
  | 'OB'
  | 'Line Up'
  | 'Inactive'
  | 'Not Interested'
  | 'Wrong Number'
  | 'Not Eligible'
  | 'Doc / Vehicle / Vacancy Issue'
  | 'Call Back Later'
  | 'Number not in Service'
  | 'Ringing / Busy / Forward / Call Disconnected'
  | 'Interested';

export type MainSourceCategory =
  | 'Job Portal'
  | 'Reference'
  | 'Social Media'
  | 'Advertisement'
  | 'Enquiry'
  | 'Marketing Activity';

export type JobPortalOption = 'Apna' | 'WorkIndia' | 'Indeed' | 'Naukri' | 'Foundit' | 'Others';
export type SocialMediaOption = 'Facebook' | 'WhatsApp' | 'Instagram' | 'Telegram' | 'LinkedIn' | 'Others';

export interface CandidateSource {
  category: MainSourceCategory;
  detailOption?: JobPortalOption | SocialMediaOption | string;
  detailText?: string; // Reference Name or Campaign Name or custom text
}

export type ClientPlacementType = 'Payroll' | 'OTS';

export interface PlacementRecord {
  id: string;
  clientId: string;
  clientName: string;
  clientType: ClientPlacementType;
  openingId?: string;
  openingTitle?: string;
  activeDate: string; // ISO date
  payrollEmployeeId?: string;
  dateOfBirth?: string;
  status: 'Active' | 'Completed' | 'Terminated' | 'Transferred';
  createdAt: string;
}

export interface AssignmentHistoryRecord {
  id: string;
  candidateId: string;
  fromRecruiterId: string;
  fromRecruiterName: string;
  toRecruiterId: string;
  toRecruiterName: string;
  assignedByUserId: string;
  assignedByUserName: string;
  assignedAt: string;
  reason?: string;
}

export interface InteractionTimelineRecord {
  id: string;
  candidateId: string;
  recruiterId: string;
  recruiterName: string;
  status: CandidateStatus;
  clientId?: string;
  clientName?: string;
  notes: string;
  issueDescription?: string;
  followUpDate?: string;
  interviewDate?: string;
  createdAt: string;
}

export interface CareerJourneyStep {
  stage: 'Lead Created' | 'Interested' | 'Interview' | 'Joined' | 'Client Change' | 'Rejoined';
  date: string;
  details: string;
  completed: boolean;
}

export interface FollowUpRecord {
  id: string;
  candidateId: string;
  candidateName: string;
  candidatePhone: string;
  recruiterId: string;
  recruiterName: string;
  followUpDate: string; // YYYY-MM-DD
  notes: string;
  status: 'Pending' | 'Completed' | 'Overdue';
  createdAt: string;
}

export interface CandidateDocument {
  id: string;
  documentType: 'Resume' | 'Aadhaar Card' | 'PAN Card' | 'Driving Licence' | 'Bank Details';
  fileName?: string;
  fileUrl?: string;
  accountNumber?: string;
  ifscCode?: string;
  uploadedAt?: string;
  isVerified: boolean;
  ocrPlaceholderText?: string;
}

export interface CandidateAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SystemAuditRecord {
  id: string;
  action: 'Created' | 'Imported' | 'Assigned' | 'Status Changed' | 'Client Changed' | 'Employee ID Updated' | 'Blacklisted';
  performedBy: string;
  timestamp: string;
  details: string;
}

export interface Candidate {
  id: string; // HHCD0001
  name: string;
  phone: string;
  area: string;
  city: string;
  role: string; // Smart text
  status: CandidateStatus;
  
  // Assignment
  assignedRecruiterId: string;
  assignedRecruiterName: string;
  teamId?: string;
  teamName?: string;

  // Source & Details
  source: CandidateSource;
  sourceHistory: Array<{ source: CandidateSource; date: string }>;
  phoneHistory: Array<{ phone: string; changedAt: string }>;

  // Placement & Work details
  currentPlacement?: PlacementRecord;
  placementHistory: PlacementRecord[];

  // Timeline & History
  interactionTimeline: InteractionTimelineRecord[];
  assignmentHistory: AssignmentHistoryRecord[];
  followUps: FollowUpRecord[];
  documents: CandidateDocument[];
  attachments: CandidateAttachment[];
  systemAudit: SystemAuditRecord[];

  // Active / Payroll Details
  payrollEmployeeId?: string;
  dateOfBirth?: string;
  activeDate?: string;
  followUpDate?: string;
  interviewDate?: string;
  currentClientId?: string;
  currentClientName?: string;

  // Issues & Blacklist
  issueDescription?: string;
  isBlacklisted: boolean;
  blacklistReason?: string;
  blacklistedBy?: string;
  blacklistedAt?: string;

  // Metrics
  callsCount: number;

  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateInput {
  name: string;
  phone: string;
  area: string;
  city: string;
  role: string;
  source: CandidateSource;
  assignedRecruiterId?: string;
  assignedRecruiterName?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingCandidate?: Candidate;
  isRestrictedView: boolean; // true for Recruiter, false for TL/Admin
}

export interface BulkImportRow {
  name: string;
  phone: string;
  area: string;
  city: string;
  role: string;
  isValid: boolean;
  validationErrors: string[];
  isDuplicate: boolean;
}

export interface ImportHistoryItem {
  id: string;
  fileName: string;
  importedCount: number;
  failedCount: number;
  importedBy: string;
  importedAt: string;
  source: CandidateSource;
}

export interface QuickUpdateInput {
  candidateId: string;
  status: CandidateStatus;
  clientId?: string;
  clientName?: string;
  openingId?: string;
  notes: string;
  issueDescription?: string;
  followUpDate?: string;
  interviewDate?: string;
  payrollEmployeeId?: string;
  dateOfBirth?: string;
}

// Clean extension contract payloads
export interface WorkforceSyncPayload {
  candidateId: string;
  candidateName: string;
  phone: string;
  role: string;
  clientId: string;
  clientName: string;
  clientType: ClientPlacementType;
  payrollEmployeeId?: string;
  activeDate: string;
}

export interface PerformanceSyncPayload {
  recruiterId: string;
  candidateId: string;
  action: 'CANDIDATE_ACTIVATED' | 'CALL_COMPLETED';
  pointsEarned: number;
  timestamp: string;
}
