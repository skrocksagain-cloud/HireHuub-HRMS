export type OpeningStatus = 'Draft' | 'Active' | 'OnHold' | 'Closed' | 'Cancelled';
export type OpeningPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type SalaryType = 'Monthly' | 'Annual' | 'Daily' | 'Hourly';
export type GenderPreference = 'Any' | 'Male' | 'Female';

export interface OpeningAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

export interface OpeningAuditEntry {
  id: string;
  openingId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface RawOpeningImportData {
  source: 'Excel' | 'OCR' | 'GoogleSheets' | 'Manual';
  rawFields: Record<string, string>;
}

export interface OpeningValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface OpeningSyncResult {
  success: boolean;
  syncedCount: number;
  syncedAt: string;
  errors?: string[];
}

export interface Opening {
  id: string; // Approved format: HHOP0001, HHOP0002, etc.
  clientId: string;
  clientName: string;
  title: string; // Position
  description: string;
  location: string;
  city: string;
  state: string;
  openPositions: number;
  status: OpeningStatus;
  priority: OpeningPriority;
  interviewDate?: string;
  isOutsourced: boolean;
  outsourcedVendor?: string;
  
  // Candidate Criteria
  minExperience?: number;
  maxExperience?: number;
  qualification?: string;
  genderPreference?: GenderPreference;
  ageLimit?: number;
  skills?: string[];

  // Salary & Benefits
  minSalary?: number;
  maxSalary?: number;
  salaryType?: SalaryType;
  benefits?: string[];

  // Documents Required
  requiredDocuments?: string[];

  // Tracking & Attachments
  assignedRecruiterIds: string[];
  attachments: OpeningAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOpeningInput {
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  location: string;
  city: string;
  state: string;
  openPositions: number;
  status: OpeningStatus;
  priority: OpeningPriority;
  interviewDate?: string;
  isOutsourced: boolean;
  outsourcedVendor?: string;
  minExperience?: number;
  maxExperience?: number;
  qualification?: string;
  genderPreference?: GenderPreference;
  ageLimit?: number;
  skills?: string[];
  minSalary?: number;
  maxSalary?: number;
  salaryType?: SalaryType;
  benefits?: string[];
  requiredDocuments?: string[];
  assignedRecruiterIds?: string[];
  attachments?: OpeningAttachment[];
}
