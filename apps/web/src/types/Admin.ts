export interface CompanySignature {
  id: string;
  name: string;
  designation: string;
  signatureUrl: string;
  storagePath?: string;
  isActive: boolean;
}

export interface CompanySettings {
  id: string;
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
  signatures: CompanySignature[];
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

export type ViewScopeType = 'Organization' | 'Departments' | 'Teams' | 'Reporting' | 'Assigned' | 'Own';
export type ApprovalScopeType = 'Organization' | 'Departments' | 'Teams' | 'Reporting' | 'Selected';
export type ReportingScopeType = 'DirectReports' | 'ReportingTree' | 'OwnTeam';

export interface RoleItem {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  viewScope: ViewScopeType;
  approvalScope: ApprovalScopeType;
  reportingScope: ReportingScopeType;
  departmentIds: string[];
  teamIds: string[];
  employeeIds: string[];
  branchIds: string[];
  companyIds: string[];
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
  templateName: string;
  type: string;
  category: 'HR' | 'Finance' | 'Payroll' | 'Custom';
  format: 'DOCX' | 'XLSX';
  content: string;
  templateFileUrl: string;
  templateStoragePath: string;
  activeVersion: string;
  previousVersions: TemplateHistoryEntry[];
  defaultSignatureId: string;
  includeStamp: boolean;
  includeLogo: boolean;
  headerText: string;
  footerText: string;
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
