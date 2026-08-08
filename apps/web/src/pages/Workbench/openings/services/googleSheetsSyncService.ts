import type { OpeningSyncResult } from '../../../../types/Opening';

export interface IGoogleSheetsSyncService {
  syncWithSheet(sheetId: string): Promise<OpeningSyncResult>;
}

export class GoogleSheetsSyncService implements IGoogleSheetsSyncService {
  async syncWithSheet(_sheetId: string): Promise<OpeningSyncResult> {
    // Extension Point: Future Google Sheets synchronization implementation
    throw new Error('GoogleSheetsSyncService.syncWithSheet is an extension point contract and not yet implemented.');
  }
}

export const googleSheetsSyncService = new GoogleSheetsSyncService();
