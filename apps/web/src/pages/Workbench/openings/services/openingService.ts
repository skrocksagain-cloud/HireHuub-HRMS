import type { Opening } from '../../../../types/Opening';
import { openingRepository } from '../repositories/openingRepository';
import { excelImportService } from './excelImportService';
import { ocrImportService } from './ocrImportService';
import { importValidationService } from './importValidationService';
import { importMappingService } from './importMappingService';
import { googleSheetsSyncService } from './googleSheetsSyncService';
import { attachmentStorageService } from './attachmentStorageService';
import { openingAuditService } from './openingAuditService';

export class OpeningService {
  // Prepared Extension Points for Open/Closed Principle compliance
  readonly excelImport = excelImportService;
  readonly ocrImport = ocrImportService;
  readonly importValidation = importValidationService;
  readonly importMapping = importMappingService;
  readonly googleSheetsSync = googleSheetsSyncService;
  readonly attachmentStorage = attachmentStorageService;
  readonly audit = openingAuditService;

  async getOpenings(): Promise<Opening[]> {
    return openingRepository.getOpenings();
  }

  async getOpeningById(id: string): Promise<Opening | null> {
    return openingRepository.getOpeningById(id);
  }

  async createOpening(opening: Omit<Opening, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Opening> {
    const created = await openingRepository.createOpening(opening);
    await this.audit.logActivity(created.id, 'CREATED', { title: created.title, clientName: created.clientName });
    await this.googleSheetsSync.handleOpeningSyncLifecycle(created);
    return created;
  }

  async updateOpening(id: string, updates: Partial<Opening>): Promise<Opening> {
    const updated = await openingRepository.updateOpening(id, updates);
    await this.audit.logActivity(updated.id, 'UPDATED', { updates });
    await this.googleSheetsSync.handleOpeningSyncLifecycle(updated);
    return updated;
  }

  async deleteOpening(id: string): Promise<boolean> {
    const success = await openingRepository.deleteOpening(id);
    if (success) {
      await this.audit.logActivity(id, 'DELETED');
      await this.googleSheetsSync.removeOpeningFromSheet(id);
    }
    return success;
  }
}

export const openingService = new OpeningService();
