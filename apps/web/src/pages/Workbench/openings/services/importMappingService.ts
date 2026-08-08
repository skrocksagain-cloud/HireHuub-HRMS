import type { Opening, RawOpeningImportData } from '../../../../types/Opening';

export interface IImportMappingService {
  mapToOpeningModel(rawData: RawOpeningImportData): Partial<Opening>;
}

export class ImportMappingService implements IImportMappingService {
  mapToOpeningModel(_rawData: RawOpeningImportData): Partial<Opening> {
    // Extension Point: Future mapping implementation into Hire Huub One Opening model
    throw new Error('ImportMappingService.mapToOpeningModel is an extension point contract and not yet implemented.');
  }
}

export const importMappingService = new ImportMappingService();
