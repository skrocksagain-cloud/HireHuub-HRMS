export type DocumentCategoryModule =
  | 'HR'
  | 'Recruitment'
  | 'Finance'
  | 'Payroll'
  | 'Employee'
  | 'Client'
  | 'System';

export interface DigitalSignatureMetadata {
  isDigitallySigned: boolean;
  signerName?: string;
  signatureTimestamp?: string;
  certificateIssuer?: string;
  eSignProvider?: 'Aadhaar eSign' | 'DSC Certificate' | 'Internal Digital Signature';
}

export interface RegisteredDocument {
  id: string;
  documentId: string;
  documentType: string;
  module: DocumentCategoryModule;
  employeeId?: string;
  candidateId?: string;
  clientId?: string;
  vendorId?: string;
  templateId?: string;
  templateVersion: string;
  outputFormat?: string;
  generatedBy: string;
  generatedByName: string;
  generatedOn: string;
  storageUrl: string;
  storagePath: string;
  previewUrl: string;
  downloadCount: number;
  status: 'Generated' | 'Uploaded' | 'Emailed' | 'Archived';
  templateUsed: string;
  signatureUsed: string;
  stampUsed: boolean;
  digitalSignatureInfo?: DigitalSignatureMetadata;
  resolvedPlaceholders: Record<string, string>;
  createdAt?: string;
}

export interface DocumentFilterOptions {
  module?: DocumentCategoryModule;
  documentType?: string;
  employeeId?: string;
  candidateId?: string;
  clientId?: string;
  status?: RegisteredDocument['status'];
  searchTerm?: string;
  referenceId?: string;
  documentId?: string;
}
