/**
 * ============================================================
 * HireHuub ERP
 * Universal Document Model
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

export type DocumentType =
  | "Offer Letter"
  | "Appointment Letter"
  | "Joining Form"
  | "Increment Letter"
  | "Payslip"
  | "Salary Certificate"
  | "Experience Letter"
  | "Relieving Letter"
  | "Warning Letter"
  | "Invoice"
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
  // ==================================================
  // Firestore
  // ==================================================

  /**
   * Firestore Document ID
   */
  id?: string;

  /**
   * Human Readable Document Number
   * Example:
   * DOC000001
   */
  documentId: string;

  // ==================================================
  // Organization
  // ==================================================

  companyId: string;

  branchId: string;

  // ==================================================
  // Document Information
  // ==================================================

  /**
   * HR
   * Payroll
   * Finance
   */
  category: DocumentCategory;

  /**
   * Offer
   * Employee
   * Payroll
   */
  module: DocumentModule;

  /**
   * Offer Letter
   * Payslip
   * Invoice
   */
  documentType: DocumentType;

  /**
   * Related Record ID
   *
   * Example
   * OFF000001
   * HH000001
   */
  referenceId: string;

  /**
   * Display Title
   */
  title: string;

  /**
   * Generated File Name
   */
  fileName: string;

  /**
   * Document Version
   */
  version: number;

  /**
   * Current Status
   */
  status: DocumentStatus;

  // ==================================================
  // Storage
  // ==================================================

  /**
   * Firebase Storage Path
   */
  storagePath: string;

  /**
   * Download URL
   */
  downloadUrl: string;

  /**
   * File Size (Bytes)
   */
  fileSize: number;

  /**
   * application/pdf
   */
  mimeType: string;

  // ==================================================
  // Signature
  // ==================================================

  /**
   * Whether signature is required
   */
  requiresSignature: boolean;

  /**
   * Whether document is signed
   */
  isSigned: boolean;

  /**
   * Signed By
   */
  signedBy: string;

  /**
   * Signed Date
   */
  signedAt?: unknown;

  // ==================================================
  // QR Verification
  // ==================================================

  /**
   * QR Verification URL
   */
  qrCodeUrl: string;

  // ==================================================
  // Security
  // ==================================================

  /**
   * Lock document after approval
   */
  isLocked: boolean;

  lockedAt?: unknown;

  // ==================================================
  // Generated Details
  // ==================================================

  generatedBy: string;

  generatedAt?: unknown;

  // ==================================================
  // Email
  // ==================================================

  emailed: boolean;

  emailedTo: string;

  emailedAt?: unknown;

  // ==================================================
  // Download
  // ==================================================

  downloadCount: number;

  lastDownloadedAt?: unknown;

  // ==================================================
  // Archive
  // ==================================================

  archived: boolean;

  archivedAt?: unknown;

  // ==================================================
  // Audit
  // ==================================================

  remarks: string;

  createdBy: string;

  updatedBy: string;

  createdAt?: unknown;

  updatedAt?: unknown;
}