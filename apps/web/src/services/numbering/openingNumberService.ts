import { adminService } from '../admin/adminService';
import type { Opening } from '../../types/Opening';

export class OpeningNumberService {
  private async getPrefix(): Promise<string> {
    try {
      const company = await adminService.getCompanySettings();
      if (company && company.openingPrefix?.trim()) {
        return company.openingPrefix.trim();
      }
    } catch {
      // Fallback to approved default prefix
    }
    return 'HHOP';
  }

  async generateNextNumber(openings: Partial<Opening>[]): Promise<string> {
    const prefix = await this.getPrefix();
    return this.calculateNextNumber(openings, prefix);
  }

  /**
   * Generates the next sequential Opening Number.
   * Format: HHOP0001, HHOP0002... (Prefix dynamically derived from Administration)
   */
  calculateNextNumber(openings: Partial<Opening>[], prefix: string): string {
    let maxSequence = 0;

    for (const opening of openings) {
      const id = opening.id || '';
      const sequence = this.extractSequenceNumber(id);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }

    const nextSequence = maxSequence + 1;
    return `${prefix}${String(nextSequence).padStart(4, '0')}`;
  }

  private extractSequenceNumber(identifier: string): number {
    if (!identifier) return 0;
    const match = identifier.match(/(\d+)/);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return 0;
  }
}

export const openingNumberService = new OpeningNumberService();
