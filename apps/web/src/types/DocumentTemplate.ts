export type DocumentCategory = 'Google Sheets' | 'Google Docs';

export type GoogleSheetsTemplateType = 'Invoice' | 'Credit Note' | 'Payslip';

export type GoogleDocsTemplateType =
  | 'Offer Letter'
  | 'Appointment Letter'
  | 'Increment Letter'
  | 'Warning Letter'
  | 'Confirmation Letter'
  | 'Experience Letter'
  | 'Relieving Letter';

export type DocumentTemplateType = GoogleSheetsTemplateType | GoogleDocsTemplateType;

export interface DocumentTemplateReference {
  templateId: string;
  templateName: string;
  category: DocumentCategory;
  type: DocumentTemplateType;
  version: number;
  externalSpreadsheetId?: string;
  externalDocId?: string;
  isActive: boolean;
  description?: string;
  updatedAt?: string;
}
