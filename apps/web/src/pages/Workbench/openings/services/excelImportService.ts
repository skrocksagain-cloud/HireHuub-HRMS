import type { RawOpeningImportData } from '../../../../types/Opening';

export interface IExcelImportService {
  parseExcelFile(file: File): Promise<RawOpeningImportData[]>;
}

export class ExcelImportService implements IExcelImportService {
  async parseExcelFile(_file: File): Promise<RawOpeningImportData[]> {
    // Extension Point: Future Excel parsing implementation
    throw new Error('ExcelImportService.parseExcelFile is an extension point contract and not yet implemented.');
  }
}

export const excelImportService = new ExcelImportService();
