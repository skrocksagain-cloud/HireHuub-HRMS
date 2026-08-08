export class CampaignNumberService {
  private static PREFIX = 'HHCMP';
  private static PADDING_DIGITS = 6;

  /**
   * Generates the next sequential Campaign Number.
   * Approved Format: HHCMP000001, HHCMP000002, HHCMP000003, ...
   */
  calculateNextNumber(existingCampaigns: Array<{ id?: string; campaignNumber?: string }>): string {
    let maxSequence = 0;

    for (const campaign of existingCampaigns) {
      const idStr = campaign.campaignNumber || campaign.id || '';
      const sequence = this.extractSequenceNumber(idStr);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }

    const nextSequence = maxSequence + 1;
    return `${CampaignNumberService.PREFIX}${String(nextSequence).padStart(CampaignNumberService.PADDING_DIGITS, '0')}`;
  }

  private extractSequenceNumber(identifier: string): number {
    if (!identifier) return 0;
    const match = identifier.match(/HHCMP(\d+)/i) || identifier.match(/(\d+)/);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return 0;
  }
}

export const campaignNumberService = new CampaignNumberService();
