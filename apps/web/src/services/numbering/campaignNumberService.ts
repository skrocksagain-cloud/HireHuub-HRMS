import { adminService } from '../admin/adminService';

export class CampaignNumberService {
  private async getPrefix(): Promise<string> {
    const company = await adminService.getCompanySettings();
    if (!company.campaignPrefix?.trim()) throw new Error('Administration → Company Settings is missing the campaign prefix.');
    return company.campaignPrefix;
  }

  async generateNextNumber(existingCampaigns: Array<{ id?: string; campaignNumber?: string }>): Promise<string> {
    const prefix = await this.getPrefix();
    return this.calculateNextNumber(existingCampaigns, prefix);
  }

  /**
   * Generates the next sequential Campaign Number.
   * Format: HHCMP000001, HHCMP000002... (Prefix dynamically derived from Administration)
   */
  calculateNextNumber(existingCampaigns: Array<{ id?: string; campaignNumber?: string }>, prefix: string): string {
    let maxSequence = 0;

    for (const campaign of existingCampaigns) {
      const idStr = campaign.campaignNumber || campaign.id || '';
      const sequence = this.extractSequenceNumber(idStr);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }

    const nextSequence = maxSequence + 1;
    return `${prefix}${String(nextSequence).padStart(6, '0')}`;
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

export const campaignNumberService = new CampaignNumberService();
