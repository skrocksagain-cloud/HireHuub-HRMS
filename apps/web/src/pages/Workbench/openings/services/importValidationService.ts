import type { OpeningValidationResult, RawOpeningImportData } from '../../../../types/Opening';

export interface IImportValidationService {
  validateImportData(data: RawOpeningImportData[]): Promise<OpeningValidationResult>;
}

export class ImportValidationService implements IImportValidationService {
  async validateImportData(data: RawOpeningImportData[]): Promise<OpeningValidationResult> {
    if (!data.length) return { isValid: false, errors: ['No parsed opening rows were supplied.'], warnings: [] };
    return {
      isValid: data.every((row) => Boolean(row.rawFields.Title || row.rawFields.title || row.rawFields.Position || row.rawFields.position)),
      errors: data.flatMap((row, index) => row.rawFields.Title || row.rawFields.title || row.rawFields.Position || row.rawFields.position ? [] : [`Row ${index + 2}: Title or Position is required.`]),
      warnings: [],
    };
  }
}

export const importValidationService = new ImportValidationService();
