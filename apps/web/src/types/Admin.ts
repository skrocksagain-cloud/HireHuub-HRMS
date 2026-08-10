export type SignatureType = 'Image' | 'Digital Certificate' | 'Aadhaar eSign' | 'DSC Token';

export interface CompanySignature {
  id: string;
  name: string;
  designation: string;
  signatureUrl: string;
  storagePath?: string;
  signatureType?: SignatureType;
  isActive: boolean;
}

export interface BrandingProfile {
  id: string;
  name: string;
  isDefault: boolean;
  letterheadUrl: string;
  letterheadStoragePath?: string;
  letterFooterUrl: string;
  letterFooterStoragePath?: string;
}

export interface CompanySettings {
  id: string;
  companyId?: string;
  companyName: string;
  brandName: string;
  gstin: string;
  pan: string;
  cin: string;
  address: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName: string;
  };
  website: string;
  email: string;
  phone: string;
  logoUrl: string;
  logoStoragePath?: string;
  stampUrl: string;
  stampStoragePath?: string;
  letterheadUrl?: string;
  letterheadStoragePath?: string;
  letterFooterUrl?: string;
  letterFooterStoragePath?: string;
  brandingProfiles?: BrandingProfile[];
  signatures: CompanySignature[];
  registeredState?: string;
  registeredCity?: string;
  postalCode?: string;
  invoicePrefix?: string;
  creditNotePrefix?: string;
  employeeCodePrefix?: string;
  offerPrefix?: string;
  documentPrefix?: string;
  expensePrefix?: string;
  campaignPrefix?: string;
  openingPrefix?: string;
  financialYearStartMonth?: number;
  defaultGstRate?: number;
  defaultTdsRate?: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DesignationItem {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ViewScopeType = 'Organization' | 'Departments' | 'Teams' | 'Reporting' | 'Assigned' | 'Own' | 'Company' | 'Branch' | 'Selected';
export type ApprovalScopeType = 'Organization' | 'Departments' | 'Teams' | 'Reporting' | 'Selected' | 'Company' | 'Branch' | 'Own';
export type ReportingScopeType = 'DirectReports' | 'ReportingTree' | 'OwnTeam';
export type ExportScopeType = 'Organization' | 'Departments' | 'Teams' | 'Own' | 'None';
export type CalendarScopeType = 'Organization' | 'Departments' | 'Teams' | 'Private' | 'None';

export interface EmergencyOverrideState {
  isEnabled: boolean;
  operator: string;
  reason: string;
  expiresAt: string;
}

export interface RoleItem {
  id: string;
  roleId?: string;
  name: string;
  roleName?: string;
  description: string;
  permissions: string[];
  modules?: string[]; // e.g. ['dashboard', 'employees', 'recruitment', 'finance', 'marketing', 'documents', 'management']
  parentRoleId?: string;
  viewScope: ViewScopeType;
  editScope?: ViewScopeType;
  deleteScope?: ViewScopeType;
  approvalScope: ApprovalScopeType;
  exportScope?: ExportScopeType;
  reportingScope: ReportingScopeType;
  departmentIds: string[];
  departmentScope?: string[];
  teamIds: string[];
  teamScope?: string[];
  employeeIds: string[];
  employeeScope?: string[];
  branchIds: string[];
  branchScope?: string[];
  companyIds: string[];
  companyScope?: string[];
  candidateScope?: 'Organization' | 'Departments' | 'Assigned';
  documentScope?: 'Organization' | 'Authorized' | 'Own';
  dashboardScope?: string[];
  financeScope?: 'Organization' | 'Assigned' | 'None';
  leaveScope?: 'Organization' | 'Departments' | 'Teams' | 'Own';
  attendanceScope?: 'Organization' | 'Departments' | 'Teams' | 'Own';
  performanceScope?: 'Organization' | 'Departments' | 'Direct Reports' | 'Own';
  recruitmentScope?: 'Organization' | 'Departments' | 'Assigned';
  calendarScope?: CalendarScopeType;
  notificationScope?: 'Organization' | 'Module' | 'Own';
  featureFlags?: Record<string, boolean>;
  emergencyOverride?: EmergencyOverrideState;
  isPreset?: boolean;
  presetName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionDefinition {
  id: string;
  key: string;
  label: string;
  category: 'Employees' | 'Recruitment' | 'Finance' | 'Documents' | 'Leave' | 'Attendance' | 'Performance' | 'Admin';
  description: string;
}

export interface HierarchyNode {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  departmentId: string;
  departmentName: string;
  reportingToId: string | null;
  reportingToName: string | null;
  status?: string;
  updatedAt?: string;
}

export interface WorkflowStep {
  stepOrder: number;
  name: string;
  approverRole: string;
  approverEmployeeId?: string;
}

export interface WorkflowRule {
  id: string;
  module: 'Leave' | 'Recruitment' | 'Documents' | 'Finance' | 'Performance';
  name: string;
  triggerEvent: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateHistoryEntry {
  version: string;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  storagePath: string;
}

export interface DocumentTemplateConfig {
  id: string;
  templateId?: string;
  templateName: string;
  type: string;
  clientName?: string;
  companyName?: string;
  category: 'HR' | 'Finance' | 'Payroll' | 'Custom';
  format: 'DOCX' | 'XLSX' | 'PDF';
  content?: string;
  templateFileUrl: string;
  templateStoragePath: string;
  activeVersion: string;
  version?: number;
  status?: 'Active' | 'Inactive';
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  remarks?: string;
  previousVersions: TemplateHistoryEntry[];
  assignedSignatureId?: string;
  defaultSignatureId: string;
  useCompanyLetterhead?: boolean;
  includeLetterhead?: boolean;
  useCompanyFooter?: boolean;
  includeFooter?: boolean;
  useOfficialStamp?: boolean;
  includeStamp: boolean;
  brandingProfileId?: string;
  headerText?: string;
  footerText?: string;
  placeholders: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  modifiedBy?: string;
}

export interface BigDayConfig {
  id: string;
  date: string;
  clientIds: string[];
  clientNames: string[];
  bonus: number;
  status: 'Active' | 'Scheduled' | 'Completed';
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterDataConfig {
  employeePrefix: string;
  invoicePrefix: string;
  documentPrefix: string;
  offerPrefix: string;
  leaveTypes: string[];
  employmentTypes: string[];
  bloodGroups: string[];
  genderOptions: string[];
  states: string[];
  cities: string[];
  countries: string[];
  currencies: string[];
  taxRates: number[];
  financialYears: string[];
  updatedAt?: string;
}

export interface NotificationSettings {
  channels: {
    inApp: boolean;
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
    push: boolean;
  };
  triggers: Record<string, boolean>;
  updatedAt?: string;
}

export interface SecuritySettings {
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  passwordMinLength: number;
  requireSpecialChar: boolean;
  sessionTimeoutMinutes: number;
  updatedAt?: string;
}

export interface PasswordResetRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  newTemporaryPassword?: string;
}

export interface AdminAuditEntry {
  id: string;
  whoId: string;
  whoName: string;
  whatAction: string;
  entityName: string;
  entityId: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}
