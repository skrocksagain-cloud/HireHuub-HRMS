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

export interface LegalCompanyEntity {
  legalCompanyName: string;
  cin: string;
  pan: string;
  gstin: string;
  registeredOfficeAddress: string;
  incorporationDetails?: string;
  legalContactDetails?: {
    email: string;
    phone: string;
  };
  statutoryInfo?: Record<string, string>;
}

export interface BrandDocumentStorageConfig {
  folderId: string;
}

export interface BrandProfile {
  id: string;
  brandName: string;
  isDefault?: boolean;
  isActive?: boolean;
  logoUrl?: string;
  logoStoragePath?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  stampUrl?: string;
  stampStoragePath?: string;
  brandThemeColor?: string;
  headerStyle?: string;
  footerStyle?: string;
  documentTheme?: string;
  documentStorage?: {
    OFFER_LETTER?: BrandDocumentStorageConfig;
    [documentType: string]: BrandDocumentStorageConfig | undefined;
  };
}

export interface UTBBrandConfig {
  brandProfileId: string;
  overrideSignature?: boolean;
  overrideStamp?: boolean;
  overrideBank?: boolean;
  overrideHeader?: boolean;
  overrideFooter?: boolean;
}

export interface LegalCompanyV2 {
  legalCompanyName: string;
  cin: string;
  gstin: string;
  pan: string;
  registeredOfficeAddress: string;
  state: string;
  city: string;
  pinCode: string;
  corporatePhone: string;
  corporateWebsite: string;
}

export interface BrandProfileV2 {
  id: string;
  brandName: string;
  shortName: string;
  description: string;
  themeColor: string;
  defaultLogoId?: string;
  defaultStampId?: string;
  defaultSignatoryId?: string;
  defaultBankAccountId?: string;
  defaultEmailId?: string;
  defaultPhoneId?: string;
  defaultWebsiteId?: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface CompanyEmailRegistry {
  id: string;
  emailAddress: string;
  department: string;
  brandId?: string;
  purpose: 'HR' | 'Recruitment' | 'Payroll' | 'Finance' | 'Support' | 'Sales' | 'General';
  isPrimary: boolean;
  isActive: boolean;
}

export interface CompanyPhoneRegistry {
  id: string;
  phoneNumber: string;
  department: string;
  brandId?: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface CompanyWebsiteRegistry {
  id: string;
  websiteUrl: string;
  websiteName: string;
  brandId?: string;
  purpose: 'Corporate' | 'Recruitment' | 'Careers' | 'Payroll' | 'Client Portal' | 'Employee Portal' | 'Staffing' | 'Custom';
  isPrimary: boolean;
  isActive: boolean;
}

export interface CompanyBankAccountV2 {
  id: string;
  accountName: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  ifsc: string;
  swift?: string;
  upi?: string;
  isGstCollection: boolean;
  isPayroll: boolean;
  isInvoice: boolean;
  brandId?: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface CompanyLogoAsset {
  id: string;
  name: string;
  logoUrl: string;
  brandId?: string;
  resolution?: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface CompanyStampAsset {
  id: string;
  stampName: string;
  brandId?: string;
  stampUrl: string;
  purpose: 'HR' | 'Finance' | 'Payroll' | 'Recruitment' | 'Official' | 'Other';
  isDefault: boolean;
  isActive: boolean;
}

export interface CompanySignatoryV2 {
  id: string;
  fullName: string;
  designation: string;
  department: string;
  brandId?: string;
  signatureUrl: string;
  associatedStampId?: string;
  email?: string;
  phone?: string;
  isDefault: boolean;
  isActive: boolean;
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
  legalEntity?: LegalCompanyEntity;
  brandingProfiles?: BrandingProfile[];
  brandProfiles?: BrandingProfile[];
  brandProfilesList?: BrandProfile[];
  signatures: CompanySignature[];
  legalCompanyV2?: LegalCompanyV2;
  brandProfilesV2?: BrandProfileV2[];
  emailRegistry?: CompanyEmailRegistry[];
  phoneRegistry?: CompanyPhoneRegistry[];
  websiteRegistry?: CompanyWebsiteRegistry[];
  bankAccountsV2?: CompanyBankAccountV2[];
  logoLibrary?: CompanyLogoAsset[];
  stampLibrary?: CompanyStampAsset[];
  signatoriesV2?: CompanySignatoryV2[];
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
  noticePeriod?: number;
  probationDays?: number;
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
export type ApprovalScopeType = 'Organization' | 'Departments' | 'Teams' | 'Reporting' | 'Selected' | 'Company' | 'Branch' | 'Own' | 'None';
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
  department?: string;
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

export interface UTBHeaderElement {
  id: string;
  type: 'logo' | 'brandName' | 'legalName' | 'registeredAddress' | 'brandAddress' | 'phone' | 'email' | 'website' | 'cin' | 'gst' | 'pan' | 'title' | 'divider';
  position: 'left' | 'center' | 'right';
  order: number;
  visible: boolean;
  fontSize?: number;
  isBold?: boolean;
  color?: string;
}

export interface UTBFooterElement {
  id: string;
  type: 'registeredAddress' | 'brandAddress' | 'email' | 'phone' | 'website' | 'confidentialNotice' | 'generatedDate' | 'generatedTime' | 'pageNumber' | 'qrCode' | 'poweredBy' | 'divider';
  position: 'left' | 'center' | 'right';
  order: number;
  visible: boolean;
  fontSize?: number;
  isBold?: boolean;
  color?: string;
}

export interface UTBPageSettings {
  pageSize: 'A4_PORTRAIT' | 'A4_LANDSCAPE' | 'LETTER' | 'LEGAL';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; bottom: number; left: number; right: number };
  headerHeight: number;
  footerHeight: number;
  contentWidth: string;
}

export interface UTBTheme {
  id: string;
  name: string;
  isDefault?: boolean;
  fontFamily: string;
  baseFontSize: number;
  headingFontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  headingStyle: 'bold' | 'uppercase' | 'colored' | 'underlined';
  textAlignment: 'left' | 'center' | 'justify' | 'right';
  primaryColor: string;
  secondaryColor: string;
  headerDividerStyle?: 'solid' | 'dashed' | 'double' | 'gradient' | 'none';
  footerDividerStyle?: 'solid' | 'dashed' | 'double' | 'gradient' | 'none';
  typography?: {
    fontFamily: string;
    fontSize: {
      title: number;
      h1: number;
      h2: number;
      h3: number;
      body: number;
      caption: number;
    };
    lineHeight: number;
  };
  tableStyle: {
    headerBackground: string;
    headerTextColor: string;
    borderColor: string;
    alternateRowBackground?: string;
    fontSize: number;
  };
  spacing: {
    sectionGap: number;
    componentGap: number;
    lineHeight: number;
  };
  borders: {
    width: number;
    color: string;
    radius: number;
  };
}

export type UTBComponentType =
  | 'header'
  | 'footer'
  | 'heading'
  | 'paragraph'
  | 'richtext'
  | 'field'
  | 'table'
  | 'image'
  | 'signatory'
  | 'stamp'
  | 'divider'
  | 'spacer'
  | 'columns'
  | 'conditional'
  | 'pagebreak';

export interface UTBStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '500' | '600' | '700';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  marginTop?: number;
  marginBottom?: number;
  paddingTop?: number;
  paddingBottom?: number;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
}

export interface UTBComponent {
  id: string;
  type: UTBComponentType;
  label?: string;
  content?: string;
  fieldKey?: string;
  badgeText?: string;
  style?: UTBStyle;
  labels?: Array<{
    id: string;
    text: string;
    visible?: boolean;
    order?: number;
    style?: UTBStyle;
  }>;
  fields?: Array<{
    id: string;
    label: string;
    binding?: string;
    visible?: boolean;
    order?: number;
    style?: UTBStyle;
  }>;
  columns?: Array<{
    id?: string;
    key: string;
    header?: string;
    label: string;
    binding?: string;
    dataType?: string;
    datatype?: string;
    width?: string;
    alignment?: 'left' | 'center' | 'right';
    align?: 'left' | 'center' | 'right';
    isRequired?: boolean;
    visible?: boolean;
    order?: number;
  }>;
  rows?: Array<{
    id: string;
    label: string;
    formula?: string;
    visible?: boolean;
    highlight?: boolean;
    style?: UTBStyle;
  }>;
  cards?: Array<{
    id: string;
    title: string;
    subtitle?: string;
    badge?: string;
    fields?: Array<{ label: string; binding: string }>;
    style?: UTBStyle;
    visible?: boolean;
  }>;
  tableData?: {
    tableType: 'generic' | 'salary' | 'invoice_items' | 'attendance' | 'leave' | 'performance';
    columns: Array<{ header: string; key: string; width?: string; align?: 'left' | 'center' | 'right' }>;
  };
  conditionalData?: {
    conditionKey: string;
    operator: 'equals' | 'truthy' | 'not_empty';
    expectedValue?: string;
    thenComponents: UTBComponent[];
    elseComponents?: UTBComponent[];
  };
  columnComponents?: UTBComponent[][];
  config?: Record<string, unknown>;
}

export interface UTBHeaderConfig {
  elements?: UTBHeaderElement[];
  showLogo?: boolean;
  showCompanyName?: boolean;
  showLegalName?: boolean;
  showAddress?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
  showWebsite?: boolean;
  showCin?: boolean;
  showGstin?: boolean;
  showPan?: boolean;
  showDivider?: boolean;
  dividerStyle?: 'solid' | 'dashed' | 'double' | 'gradient' | 'none';
  alignment?: 'left' | 'center' | 'right';
  style?: UTBStyle;
}

export interface UTBFooterConfig {
  footerMode?: 'signed' | 'computer_generated';
  showSignature?: boolean;
  showStamp?: boolean;
  elements?: UTBFooterElement[];
  showAddress?: boolean;
  showWebsite?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  showConfidentialNotice?: boolean;
  noticeText?: string;
  showCopyright?: boolean;
  copyrightText?: string;
  showPageNumbers?: boolean;
  showPoweredBy?: boolean;
  alignment?: 'left' | 'center' | 'right';
  style?: UTBStyle;
}

export interface UTBValidationError {
  type: 'error' | 'warning';
  message: string;
  code: string;
  sectionId?: string;
  field?: string;
}

export interface DocumentSnapshot {
  snapshotId: string;
  templateId: string;
  templateVersion: number;
  documentType: string;
  brandSnapshot: Record<string, unknown>;
  companySnapshot: Record<string, unknown>;
  signatorySnapshot: Record<string, unknown>;
  employeeSnapshot: Record<string, unknown>;
  salarySnapshot: Record<string, unknown>;
  generatedAt: string;
  generatedBy: string;
}

export type ContentScope = 'Global' | 'LegalCompany' | 'Brand';
export type ContentKind = 'Component' | 'Clause' | 'Snippet' | 'Checklist' | 'Policy' | 'SOP';
export type ContentLifecycleState = 'Draft' | 'Under_Review' | 'Approved' | 'Published' | 'Archived';

export interface UTBAIMetadata {
  purpose?: string;
  keywords?: string[];
  tone?: 'Formal' | 'Corporate' | 'Legal' | 'Friendly';
  applicableDocumentTypes?: string[];
  applicableDepartments?: string[];
  applicableEmploymentTypes?: string[];
}

export interface UTBSnippet {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  scope: ContentScope;
  brandProfileId?: string;
  legalCompanyId?: string;
  version: number;
  lifecycleState: ContentLifecycleState;
  usageCount: number;
  isFavorite?: boolean;
  isArchived?: boolean;
  aiMetadata?: UTBAIMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface UTBClause {
  id: string;
  title: string;
  category: string;
  tags?: string[];
  content: string;
  scope: ContentScope;
  brandProfileId?: string;
  legalCompanyId?: string;
  version: number;
  lifecycleState: ContentLifecycleState;
  effectiveDate?: string;
  expiryDate?: string;
  isMaster: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  usedInComponents?: string[];
  usedInTemplates?: string[];
  usedInGeneratedDocumentsCount?: number;
  aiMetadata?: UTBAIMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface UTBReusableComponent {
  id: string;
  name: string;
  category: string;
  tags?: string[];
  description?: string;
  components: UTBComponent[];
  usedClauseIds?: string[];
  usedSnippetIds?: string[];
  scope: ContentScope;
  brandProfileId?: string;
  legalCompanyId?: string;
  version: number;
  lifecycleState: ContentLifecycleState;
  isFavorite?: boolean;
  isArchived?: boolean;
  usedInTemplates?: string[];
  aiMetadata?: UTBAIMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface UTBCategory {
  id: string;
  name: string;
  description?: string;
  type: 'component' | 'clause' | 'snippet' | 'general';
  order: number;
  isArchived?: boolean;
}

export interface UTBTag {
  id: string;
  name: string;
  color?: string;
  usageCount: number;
  isArchived?: boolean;
}

export interface ContentDependencyGraph {
  itemId: string;
  itemKind: ContentKind;
  references: Array<{ id: string; title: string; kind: ContentKind }>;
  dependencies: Array<{ id: string; title: string; kind: ContentKind }>;
  consumers: Array<{ id: string; title: string; kind: 'Template' | 'Component' | 'Clause' | 'GeneratedDocument' }>;
}

export interface UTBTemplateSchema {
  version: number;
  versionNumber?: number;
  parentTemplateId?: string;
  isPublishedVersion?: boolean;
  publishedAt?: string;
  publishedBy?: string;
  versionHistory?: Array<{
    version: number;
    createdAt: string;
    createdBy: string;
    state: string;
  }>;
  templateId: string;
  templateName: string;
  category: 'HR' | 'Finance' | 'Payroll' | 'Custom';
  type: string;
  customTitle?: string;
  lifecycleState: 'Draft' | 'Under_Review' | 'Approved' | 'Published' | 'Archived';
  brandProfileId?: string;
  brandConfig?: UTBBrandConfig;
  themeId?: string;
  theme?: UTBTheme;
  pageSize: 'A4_PORTRAIT' | 'A4_LANDSCAPE' | 'LETTER' | 'LEGAL';
  pageSettings?: UTBPageSettings;
  margins: { top: number; bottom: number; left: number; right: number };
  header: UTBHeaderConfig;
  footer: UTBFooterConfig;
  sections: Array<{
    id: string;
    title?: string;
    sectionType?: 'header' | 'introduction' | 'employee_details' | 'employment_details' | 'compensation' | 'roles' | 'terms' | 'annexure' | 'acceptance' | 'signature' | 'footer' | 'custom';
    enabled?: boolean;
    visibilityRules?: Array<{
      fieldRef: string;
      operator: 'equals' | 'not_equals' | 'exists' | 'not_empty';
      value?: string;
    }>;
    components: UTBComponent[];
  }>;
  signatoryId?: string;
  signatoryRole?: 'MD' | 'CEO' | 'HR_HEAD' | 'BRANCH_MANAGER' | 'REGIONAL_MANAGER' | 'CUSTOM';
  includeStamp: boolean;
  approvalRequired?: boolean;
  approvalWorkflowId?: string;
  permissions?: {
    editRoles?: string[];
    publishRoles?: string[];
    generateRoles?: string[];
  };
  ocrMapping?: Record<string, string>;
  extensibility?: {
    watermark?: { text: string; opacity: number; angle: number };
    qrVerification?: boolean;
    multiLanguage?: { language: string; translations: Record<string, string> };
    clientBranding?: { clientId: string; logoOverrideUrl?: string };
    countryCompliance?: string;
  };
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
  templateFileUrl?: string;
  templateStoragePath?: string;
  googleDocTemplateId?: string;
  activeVersion: string;
  version?: number;
  status?: 'Active' | 'Inactive';
  lifecycleState?: 'Draft' | 'Under_Review' | 'Approved' | 'Published' | 'Archived';
  builderSchema?: UTBTemplateSchema;
  schema?: UTBTemplateSchema;
  themeId?: string;
  theme?: UTBTheme;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  remarks?: string;
  previousVersions: TemplateHistoryEntry[];
  assignedSignatureId?: string;
  defaultSignatureId?: string;
  useCompanyLetterhead?: boolean;
  includeLetterhead?: boolean;
  useCompanyFooter?: boolean;
  includeFooter?: boolean;
  useOfficialStamp?: boolean;
  includeStamp?: boolean;
  brandId?: string;
  brandName?: string;
  offerSchema?: OfferLetterTemplateSchema;
  publishedAt?: string;
  publishedBy?: string;
  versionNumber?: number;
  brandingProfileId?: string;
  brandProfileId?: string;
  legalEntityId?: string;
  isDefaultBrandTemplate?: boolean;
  generatedDocumentsCount?: number;
  lastGeneratedAt?: string;
  lastGeneratedBy?: string;
  tags?: string[];
  headerText?: string;
  footerText?: string;
  placeholders?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  modifiedBy?: string;
}

export type OfferLetterBlockType =
  | 'header'
  | 'text'
  | 'heading'
  | 'paragraph'
  | 'table'
  | 'divider'
  | 'logo'
  | 'footer'
  | 'signature'
  | 'stamp'
  | 'page_break';


export interface OfferLetterBlockFormatting {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  alignment?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  marginTop?: number;
  marginBottom?: number;
  paddingTop?: number;
  paddingBottom?: number;
  color?: string;
}

export interface OfferLetterHeaderConfig {
  preset?: 'logo-left-details-right' | 'logo-center-details-below' | 'custom';
  showLogo?: boolean;
  logoHeight?: number;
  showBrandName?: boolean;
  showLegalName?: boolean;
  showAddress?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
  showWebsite?: boolean;
  showCin?: boolean;
  showPan?: boolean;
  showGstin?: boolean;
  legalFontSize?: number;
  legalAlignment?: 'left' | 'center' | 'right';
  verticalAlignment?: 'top' | 'center' | 'bottom';
  marginBottom?: number;
}

export interface OfferLetterFooterConfig {
  showConfidentialityNotice?: boolean;
  confidentialityText?: string;
  showWebsite?: boolean;
  showEmail?: boolean;
  showPageNumber?: boolean;
  showTotalPages?: boolean;
  layoutPlacement?: 'left-right' | 'center' | 'right-left';
  alignment?: 'left' | 'center' | 'right';
  fontSize?: number;
  marginTop?: number;
}

export interface OfferLetterBlock {
  id: string;
  type: OfferLetterBlockType;
  title?: string;
  isProtected?: boolean;
  isCustom?: boolean;
  content?: string;
  headingLevel?: 'h1' | 'h2' | 'h3';
  tableType?: 'SALARY_BREAKDOWN' | 'CUSTOM';
  tableColumns?: Array<{ header: string; key: string; width?: string; align?: 'left' | 'center' | 'right' }>;
  tableRows?: Array<Record<string, string>>;
  signatureSource?: 'brandDefault' | 'specific';
  signatoryId?: string;
  imageHeight?: number;
  imageWidth?: number;
  headerConfig?: OfferLetterHeaderConfig;
  footerConfig?: OfferLetterFooterConfig;
  formatting?: OfferLetterBlockFormatting;
}

export interface OfferLetterTemplateSchema {
  brandId: string;
  brandName: string;
  pageSize: 'A4';
  margins: { top: number; bottom: number; left: number; right: number };
  headerConfig?: OfferLetterHeaderConfig;
  footerConfig?: OfferLetterFooterConfig;
  blocks: OfferLetterBlock[];
}

export interface EmployeeDocumentRecord {
  id: string;
  employeeId: string;
  candidateId?: string;
  employeeName: string;
  documentType: string;
  brandProfileId: string;
  brandName: string;
  templateId: string;
  templateName: string;
  templateVersion: number;
  pdfUrl?: string;
  snapshotId: string;
  snapshot: DocumentSnapshot;
  generatedAt: string;
  generatedBy: string;
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

// ==========================================
// UNIVERSAL PAYROLL ENGINE DATA MODELS
// ==========================================

export type SalaryComponentType = 'Earning' | 'Deduction';
export type SalaryCalcType = 'Fixed' | 'Percentage' | 'Formula' | 'Performance' | 'Attendance';

export interface VisualFormulaRule {
  targetField?: string;
  operator?: 'equals' | 'greater_than' | 'less_than' | 'percentage_of' | 'multiply' | 'divide';
  conditionField?: string;
  conditionValue?: string | number;
  multiplier?: number;
  baseComponentId?: string;
  fixedAmount?: number;
}

export interface SalaryComponent {
  id: string;
  name: string;
  code: string;
  type: SalaryComponentType;
  calcType: SalaryCalcType;
  formulaRule?: VisualFormulaRule;
  formulaString?: string;
  displayOrder: number;
  isActive: boolean;
  isTaxable: boolean;
  isPfApplicable: boolean;
  isEsicApplicable: boolean;
  isVisibleOnPayslip: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandSalaryStructure {
  id: string;
  brandProfileId: string;
  brandName: string;
  legalEntityId?: string;
  name: string;
  version: number;
  status: 'Draft' | 'Published' | 'Archived';
  isDefault: boolean;
  componentIds: string[];
  effectiveFrom: string;
  effectiveTo?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSalaryProfile {
  id: string;
  employeeId: string;
  employeeName: string;
  brandProfileId: string;
  brandName: string;
  salaryStructureId: string;
  salaryStructureName: string;
  structureVersion: number;
  effectiveDate: string;
  monthlyCtc: number;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
  uanNumber?: string;
  esicNumber?: string;
  panNumber?: string;
  taxRegime: 'Old' | 'New';
  paymentMode: 'Bank Transfer' | 'Cheque' | 'Cash';
  costCenter: string;
  payrollStatus: 'Active' | 'On_Hold' | 'Suspended';
  customComponentOverrides?: Record<string, number>;
  updatedAt: string;
}

export interface StatutoryRuleConfig {
  pfEmployerPercent: number;
  pfEmployeePercent: number;
  pfCapLimit: number;
  esicEmployerPercent: number;
  esicEmployeePercent: number;
  esicCapLimit: number;
  ptSlabs: Array<{ minGross: number; maxGross: number; ptAmount: number }>;
  updatedAt: string;
}

export type PayrollRunStatus = 'Draft' | 'Calculated' | 'Review' | 'Finalized' | 'Released' | 'Archived';

export interface PayrollValidationItem {
  type: 'error' | 'warning';
  code: string;
  employeeId?: string;
  employeeName?: string;
  message: string;
}

export interface PayrollCalculationResult {
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  department?: string;
  brandProfileId: string;
  monthlyCtc: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  daysInMonth?: number;
  totalWorkingDays?: number;
  paidHolidayDays?: number;
  weekOffDays?: number;
  paidLeaveDays?: number;
  paidDays?: number;
  monthlyGross?: number;
  earnedGross?: number;
  workingDays: number;
  presentDays: number;
  lopDays: number;
  performanceScore: number;
  performanceIncentive: number;
  earningsBreakdown: Array<{ componentId: string; name: string; amount: number }>;
  deductionsBreakdown: Array<{ componentId: string; name: string; amount: number }>;
  employerContributions: Array<{ name: string; amount: number }>;
  isCalculated: boolean;
}

export interface PayrollRunRecord {
  id: string;
  month: string; // e.g. "2026-07"
  year: number;
  brandProfileId: string;
  brandName: string;
  status: PayrollRunStatus;
  totalEmployees: number;
  totalGrossPay: number;
  totalIncentive?: number;
  totalDeductions: number;
  totalNetPayable: number;
  totalEmployerCost: number;
  validationItems: PayrollValidationItem[];
  hasErrors: boolean;
  employeeResults: PayrollCalculationResult[];
  excludedEmployees?: Array<{
    employeeId: string;
    employeeCode?: string;
    employeeName: string;
    reason: string;
  }>;
  lockedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  finalizedAt?: string;
  finalizedBy?: string;
  releasedAt?: string;
  releasedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollSnapshot {
  snapshotId: string;
  payrollRunId: string;
  employeeId: string;
  employeeSnapshot: Record<string, unknown>;
  attendanceSnapshot: Record<string, unknown>;
  performanceSnapshot: Record<string, unknown>;
  salaryStructureSnapshot: Record<string, unknown>;
  brandSnapshot: Record<string, unknown>;
  companySnapshot: Record<string, unknown>;
  calculationResult: PayrollCalculationResult;
  generatedAt: string;
  generatedBy: string;
}

export type PayslipStatus = 'Calculated' | 'Generated' | 'Released';

export interface GeneratedPayslipRecord {
  id: string;
  payslipId?: string;
  payrollRunId: string;
  employeeId: string;
  employeeCode?: string;
  employeeName: string;
  month: string;
  salaryMonth?: string;
  brandProfileId: string;
  brandName: string;
  templateId: string;
  templateVersion: number;
  gross?: number;
  incentive?: number;
  deductions?: number;
  netPay: number;
  pdfUrl?: string;
  storagePath?: string;
  downloadUrl?: string;
  fileName?: string;
  documentId?: string;
  snapshotId: string;
  snapshot: PayrollSnapshot;
  status: PayslipStatus;
  generatedAt: string;
  generatedBy: string;
  releasedAt?: string;
  releasedBy?: string;
}
