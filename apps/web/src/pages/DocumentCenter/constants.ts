import type {
  DocumentModule,
  DocumentStatus,
  DocumentType,
} from "../../types/Document";

/**
 * ============================================================
 * Document Modules
 * ============================================================
 */

export const DOCUMENT_MODULES: DocumentModule[] = [
  "Offer",
  "Employee",
  "Payroll",
  "Finance",
  "Operations",
  "Attendance",
  "Client",
  "System",
];

/**
 * ============================================================
 * Document Types
 * ============================================================
 */

export const DOCUMENT_TYPES: DocumentType[] = [
  "Offer Letter",
  "Appointment Letter",
  "Joining Form",
  "Increment Letter",
  "Payslip",
  "Salary Certificate",
  "Experience Letter",
  "Relieving Letter",
  "Warning Letter",
  "Invoice",
  "Payment Advice",
  "Candidate Payroll",
  "Other",
];

/**
 * ============================================================
 * Document Status
 * ============================================================
 */

export const DOCUMENT_STATUSES: DocumentStatus[] = [
  "Draft",
  "Generated",
  "Uploaded",
  "Sent",
  "Downloaded",
  "Archived",
];