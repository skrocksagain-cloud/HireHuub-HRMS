/**
 * ============================================================
 * HireHuub ERP
 * Universal Document Model (Sprint 02.9.5 Document Center Specification)
 * ============================================================
 */

export type DocumentModule =
  | "Offer"
  | "Employee"
  | "Payroll"
  | "Finance"
  | "Operations"
  | "Attendance"
  | "Client"
  | "System";

export type DocumentCategory =
  | "HR"
  | "Payroll"
  | "Finance"
  | "Operations"
  | "System";

export type TargetType =
  | "Employee"
  | "Department"
  | "Company"
  | "Client"
  | "Candidate"
  | "Finance";

export type DocumentType =
  | "Offer Letter"
  | "Appointment Letter"
  | "Confirmation Letter"
  | "Promotion Letter"
  | "Increment Letter"
  | "Experience Letter"
  | "Relieving Letter"
  | "Warning Letter"
  | "Show Cause Notice"
  | "NDA"
  | "Joining Form"
  | "Aadhaar"
  | "PAN"
  | "Bank Details"
  | "Education Documents"
  | "SOP"
  | "Training Material"
  | "HR Policy"
  | "Recruitment Process"
  | "Finance Process"
  | "Sales Material"
  | "Marketing Material"
  | "Employee Handbook"
  | "Holiday Calendar"
  | "Company Policies"
  | "Circular"
  | "Notice"
  | "Forms"
  | "Agreement"
  | "Purchase Order"
  | "Work Order"
  | "Invoice Copy"
  | "Credit Note"
  | "Resume"
  | "Joining Documents"
  | "Invoice"
  | "Expense Bill"
  | "GST Report"
  | "Bank Statement"
  | "Report"
  | "Payslip"
  | "Salary Certificate"
  | "Payment Receipt"
  | "Payment Advice"
  | "Candidate Payroll"
  | "Other";

export type DocumentStatus =
  | "Draft"
  | "Generated"
  | "Uploaded"
  | "Sent"
  | "Downloaded"
  | "Archived";

export interface Document {
  id?: string;
  documentId: string;
  companyId: string;
  branchId: string;

  category: DocumentCategory;
  module: DocumentModule;
  documentType: DocumentType;
  referenceId: string;
  title: string;
  fileName: string;
  version: number;
  status: DocumentStatus;

  storagePath: string;
  downloadUrl: string;
  fileSize: number;
  mimeType: string;

  requiresSignature: boolean;
  isSigned: boolean;
  signedBy: string;
  signedAt?: unknown;

  qrCodeUrl: string;

  isLocked: boolean;
  lockedAt?: unknown;

  generatedBy: string;
  generatedAt?: unknown;

  emailed: boolean;
  emailedTo: string;
  emailedAt?: unknown;

  downloadCount: number;
  lastDownloadedAt?: unknown;

  archived: boolean;
  archivedAt?: unknown;

  // Assignment & Master Ownership (Sprint 02.9.5)
  targetType?: TargetType;
  sharedWith?: string;
  assignedToId?: string;
  description?: string;
  tags?: string[];
  effectiveDate?: string;
  expiryDate?: string;

  remarks: string;
  createdBy: string;
  updatedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
