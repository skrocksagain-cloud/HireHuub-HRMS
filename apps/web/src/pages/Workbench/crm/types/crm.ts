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
  lastWorkingDate?: string;
  reason?: string;
  createdAt: string;
}

export interface AssignmentRecord {
  id: string;
  fromRecruiterId: string | null;
  fromRecruiterName: string | null;
  toRecruiterId: string;
  toRecruiterName: string;
  assignedByUserId: string;
  assignedByUserName: string;
  assignedAt: string;
  reason: string;
}

export interface InteractionRecord {
  id: string;
  timestamp: string;
  recruiterId: string;
  recruiterName: string;
  teamId?: string;
  departmentId?: string;
  previousStatus: CandidateStatus | null;
  selectedStatus: CandidateStatus;
  notes: string;
  clientId?: string | null;
  clientName?: string | null;
  followUpDate?: string | null;
  interviewDate?: string | null;
  issueDescription?: string | null;
}

export interface StatusHistoryRecord {
  id: string;
  timestamp: string;
  interactionId: string;
  recruiterId: string;
  recruiterName: string;
  previousStatus: CandidateStatus | null;
  newStatus: CandidateStatus;
}

export interface FollowUpRecord {
  id: string;
  timestamp: string;
  recruiterId: string;
  recruiterName: string;
  followUpDate: string;
  notes: string;
  status: 'Pending' | 'Completed';
}

export interface CareerJourneyStep {
  stage: 'Lead Created' | 'Interested' | 'Interview' | 'Joined' | 'Client Change' | 'Rejoined';
  date: string;
  details: string;
  completed: boolean;
}

export interface CandidateDocument {
  id: string;
  documentType: 'Resume' | 'Aadhaar Card' | 'PAN Card' | 'Driving Licence' | 'Bank Details';
  fileName?: string;
  fileUrl?: string;
  accountNumber?: string;
  ifscCode?: string;
  documentNumber?: string; // Used for Aadhaar, PAN, Driving Licence
  documentDetails?: string; // Used for Resume or other general details
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
  action: 'Created' | 'Imported' | 'Assigned' | 'Status Changed' | 'Client Changed' | 'Employee ID Updated' | 'Blacklisted' | 'Terminated' | 'Completed' | 'Transferred';
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
  currentCrmStatus: CandidateStatus | null; // Phase 2: null = Not Contacted
  
  // Assignment
  assignedRecruiterId: string;
  assignedRecruiterName: string;
  teamId?: string;
  teamName?: string;
  departmentId?: string; // added to match scopes if needed

  // Source & Details
  source: CandidateSource;
  sourceHistory: Array<{ source: CandidateSource; date: string }>;
  phoneHistory: Array<{ phone: string; changedAt: string }>;

  // Placement & Work details
  currentPlacement?: PlacementRecord;
  placementHistory: PlacementRecord[];

  // Legacy arrays (marked for removal/migration)
  interactionTimeline?: any[];
  assignmentHistory?: any[];
  followUps?: any[];

  documents: CandidateDocument[];
  attachments: CandidateAttachment[];
  systemAudit: SystemAuditRecord[];

  // Active / Payroll Details
  payrollEmployeeId?: string;
  dateOfBirth?: string;
  activeDate?: string;
  joiningDate?: string;
  followUpDate?: string | null;
  interviewDate?: string | null;
  currentClientId?: string | null;
  currentClientName?: string | null;

  // Issues & Blacklist
  issueDescription?: string | null;
  isBlacklisted: boolean;
  blacklistReason?: string;
  blacklistedBy?: string;
  blacklistedAt?: string;

  // Metrics
  callsCount: number;
  lastCalledAt?: string;

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
  assignedRecruiterId?: string | null;
  assignedRecruiterName?: string | null;
  targetTeamId?: string | null;
  targetDepartmentId?: string | null;
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
  assignedRecruiterName?: string;
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
  interactionId: string; // Phase 2: Used as idempotency key
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
