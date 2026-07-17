import type { ReactElement } from 'react';

export type DocumentModule =
  | 'Offer'
  | 'Employee'
  | 'Payroll'
  | 'Finance'
  | 'Attendance'
  | 'Operations'
  | 'Client'
  | 'System'
  | 'Other';

export interface DocumentGenerationRequest<TPayload = unknown> {
  /**
   * Document type
   * Example:
   * OfferLetter
   * Payslip
   * AppointmentLetter
   */
  documentType: string;

  /**
   * ERP Module
   */
  module: DocumentModule;

  /**
   * Business Reference ID
   */
  referenceId: string;

  /**
   * Download file name
   */
  fileName: string;

  /**
   * Document version
   */
  version: number;

  /**
   * User generating the document
   */
  generatedBy: string;

  /**
   * Original business payload
   */
  payload: TPayload;

  /**
   * React template to render as PDF.
   */
  template: ReactElement;

  /**
   * Optional metadata
   */
  metadata?: Record<string, string>;
}