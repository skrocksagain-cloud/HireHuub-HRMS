import type { RawOpeningImportData } from '../../../../types/Opening';

export interface IOCRImportService {
  extractFromImage(file: File): Promise<RawOpeningImportData>;
}

export class OCRImportService implements IOCRImportService {
  async extractFromImage(_file: File): Promise<RawOpeningImportData> {
    // Extension Point: Future Image OCR extraction implementation
    throw new Error('OCRImportService.extractFromImage is an extension point contract and not yet implemented.');
  }
}

export const ocrImportService = new OCRImportService();
