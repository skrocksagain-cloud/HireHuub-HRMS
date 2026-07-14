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
  documentType: string;
  module: DocumentModule;
  referenceId: string;
  fileName: string;
  version: number;
  generatedBy: string;
  payload: TPayload;
  metadata?: Record<string, string>;
}
