import type { Opening } from '../../types/Opening';

export class OpeningNumberService {
  private static PREFIX = 'HHOP';
  private static PADDING_DIGITS = 4;

  /**
   * Generates the next sequential Opening Number.
   * Approved Format: HHOP0001, HHOP0002, HHOP0003, ...
   */
  calculateNextNumber(openings: Partial<Opening>[]): string {
    let maxSequence = 0;

    for (const opening of openings) {
      const id = opening.id || '';
      const sequence = this.extractSequenceNumber(id);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }

    const nextSequence = maxSequence + 1;
    return `${OpeningNumberService.PREFIX}${String(nextSequence).padStart(OpeningNumberService.PADDING_DIGITS, '0')}`;
  }

  private extractSequenceNumber(identifier: string): number {
    if (!identifier) return 0;
    const match = identifier.match(/HHOP(\d+)/i) || identifier.match(/(\d+)/);
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
