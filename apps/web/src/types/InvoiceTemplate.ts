import type { Timestamp } from 'firebase/firestore';

export type InvoiceTemplateStatus = 'Active' | 'Inactive';

export interface InvoiceTemplate {
  id: string;
  templateId: string;
  templateName: string;
  companyName: string;
  version: number;
  uploadedAt: Timestamp | string;
  uploadedBy: string;
  status: InvoiceTemplateStatus;
  fileUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  remarks?: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface InvoiceTemplateInput {
  templateId: string;
  templateName: string;
  companyName: string;
  version?: number;
  uploadedBy: string;
  status?: InvoiceTemplateStatus;
  fileUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  remarks?: string;
}
