import type { Document } from "../types/Document";

export const DEFAULT_DOCUMENT: Document = {
  // ==================================================
  // Firestore
  // ==================================================

  documentId: "",

  // ==================================================
  // Organization
  // ==================================================

  companyId: "",

  branchId: "",

  // ==================================================
  // Document Information
  // ==================================================

  category: "HR",

  module: "Offer",

  documentType: "Other",

  referenceId: "",

  title: "",

  fileName: "",

  version: 1,

  status: "Draft",

  // ==================================================
  // Storage
  // ==================================================

  storagePath: "",

  downloadUrl: "",

  fileSize: 0,

  mimeType: "application/pdf",

  // ==================================================
  // Signature
  // ==================================================

  requiresSignature: false,

  isSigned: false,

  signedBy: "",

  signedAt: undefined,

  // ==================================================
  // QR Verification
  // ==================================================

  qrCodeUrl: "",

  // ==================================================
  // Security
  // ==================================================

  isLocked: false,

  lockedAt: undefined,

  // ==================================================
  // Generated Details
  // ==================================================

  generatedBy: "",

  generatedAt: undefined,

  // ==================================================
  // Email
  // ==================================================

  emailed: false,

  emailedTo: "",

  emailedAt: undefined,

  // ==================================================
  // Download
  // ==================================================

  downloadCount: 0,

  lastDownloadedAt: undefined,

  // ==================================================
  // Archive
  // ==================================================

  archived: false,

  archivedAt: undefined,

  // ==================================================
  // Audit
  // ==================================================

  remarks: "",

  createdBy: "",

  updatedBy: "",

  createdAt: undefined,

  updatedAt: undefined,
};