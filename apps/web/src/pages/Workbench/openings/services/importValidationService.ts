import type { OpeningValidationResult, RawOpeningImportData } from '../../../../types/Opening';

export interface IImportValidationService {
  validateImportData(data: RawOpeningImportData[]): Promise<OpeningValidationResult>;
}

export class ImportValidationService implements IImportValidationService {
  async validateImportData(_data: RawOpeningImportData[]): Promise<OpeningValidationResult> {
    // Extension Point: Future import validation engine implementation
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }
}

export const importValidationService = new ImportValidationService();
