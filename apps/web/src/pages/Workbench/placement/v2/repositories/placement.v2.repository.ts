import type { PlacementV2 } from '../types/placement.v2.types';

export interface PlacementRepositoryV2 {
  getPlacementById(placementId: string, transaction?: any): Promise<PlacementV2 | null>;
  queryPlacements(filters: any): Promise<PlacementV2[]>;
  createPlacement(placement: PlacementV2, transaction?: any): Promise<void>;
  updatePlacement(placementId: string, updates: Partial<PlacementV2>, transaction?: any): Promise<void>;
  queryPayouts?(clientId?: string, month?: string): Promise<any[]>;
}
