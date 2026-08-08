import type { OpeningAuditEntry } from '../../../../types/Opening';

export interface IOpeningAuditService {
  logActivity(openingId: string, action: string, details?: Record<string, unknown>): Promise<void>;
  getTimeline(openingId: string): Promise<OpeningAuditEntry[]>;
}

export class OpeningAuditService implements IOpeningAuditService {
  async logActivity(_openingId: string, _action: string, _details?: Record<string, unknown>): Promise<void> {
    // Extension Point: Future activity timeline logging contract
  }

  async getTimeline(_openingId: string): Promise<OpeningAuditEntry[]> {
    // Extension Point: Future activity timeline retrieval contract
    return [];
  }
}

export const openingAuditService = new OpeningAuditService();
