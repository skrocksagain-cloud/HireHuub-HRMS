import type { WorkforceItem } from '../types/workforce';

export class RankingService {
  /**
   * Automatically calculates workforce rankings per client for candidates with order data support.
   * Unsupported clients (e.g. Elastic Run or non-order clients) have rank = undefined.
   * Ranks candidates with workingStatus === 'Working' by totalOrders descending.
   */
  static calculateRankings(items: WorkforceItem[]): WorkforceItem[] {
    const itemsByClient = new Map<string, WorkforceItem[]>();

    for (const item of items) {
      const clientGroup = itemsByClient.get(item.clientId) || [];
      clientGroup.push(item);
      itemsByClient.set(item.clientId, clientGroup);
    }

    const updatedItems: WorkforceItem[] = [];

    for (const [, clientItems] of itemsByClient.entries()) {
      // Check if client supports orders
      const supportsOrders = clientItems.some((c) => c.supportsOrders);

      if (!supportsOrders) {
        // Clear ranks for non-supported client candidates
        clientItems.forEach((item) => {
          updatedItems.push({ ...item, rank: undefined });
        });
        continue;
      }

      // Rank working candidates by totalOrders descending
      const workingCandidates = clientItems.filter(
        (c) => c.workingStatus === 'Working' && (c.totalOrders || 0) > 0
      );

      workingCandidates.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));

      const rankMap = new Map<string, number>();
      workingCandidates.forEach((item, index) => {
        rankMap.set(item.id, index + 1);
      });

      clientItems.forEach((item) => {
        const calculatedRank = rankMap.get(item.id);
        updatedItems.push({
          ...item,
          rank: calculatedRank,
        });
      });
    }

    return updatedItems;
  }
}
