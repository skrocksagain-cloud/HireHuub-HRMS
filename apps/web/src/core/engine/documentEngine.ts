import React from "react";

export type DocumentModule =
  | "Offer"
  | "Employee"
  | "Payroll"
  | "Finance"
  | "Attendance"
  | "Operation"
  | "Client"
  | "System";

export type DocumentType =
  | "Offer Letter"
  | "Appointment Letter"
  | "Joining Letter"
  | "Increment Letter"
  | "Payslip"
  | "Salary Certificate"
  | "Experience Letter"
  | "Warning Letter"
  | "Relieving Letter"
  | "Invoice"
  | "Other";

export type DocumentStatus =
  | "Draft"
  | "Generated"
  | "Uploaded"
  | "Emailed"
  | "Archived";

export interface GenerateDocumentOptions {
  module: DocumentModule;

  type: DocumentType;

  fileName: string;

  template: React.ReactNode;

  referenceId: string;

  generatedBy: string;
}

export interface DocumentResult {
  success: boolean;

  status: DocumentStatus;

  fileName: string;

  blob?: Blob;

  downloadUrl?: string;

  storagePath?: string;

  documentId?: string;

  error?: string;
}

class DocumentEngine {
  /**
   * Preview document.
   * React component will render directly.
   */
  preview(template: React.ReactNode): React.ReactNode {
    return template;
  }

  /**
   * Generate PDF
   *
   * Phase 1:
   * Placeholder
   *
   * Phase 2:
   * React → PDF
   */
  async generate(
    options: GenerateDocumentOptions
  ): Promise<DocumentResult> {
    console.log(
      "Generating Document...",
      options
    );

    return {
      success: true,

      status: "Generated",

      fileName: options.fileName,
    };
  }

  /**
   * Upload to Firebase Storage
   */
  async upload(
    result: DocumentResult
  ): Promise<DocumentResult> {
    console.log(
      "Uploading Document...",
      result.fileName
    );

    return {
      ...result,

      status: "Uploaded",
    };
  }

  /**
   * Register into Firestore
   */
  async register(
    result: DocumentResult
  ): Promise<DocumentResult> {
    console.log(
      "Register Document...",
      result.fileName
    );

    return result;
  }

  /**
   * Send Email
   */
  async email(
    result: DocumentResult,
    email: string
  ): Promise<DocumentResult> {
    console.log(
      `Emailing ${result.fileName} to ${email}`
    );

    return {
      ...result,

      status: "Emailed",
    };
  }

  /**
   * Download
   */
  download(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = fileName;

    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Archive
   */
  async archive(
    documentId: string
  ): Promise<void> {
    console.log(
      "Archive Document",
      documentId
    );
  }
}

const documentEngine =
  new DocumentEngine();

export default documentEngine;