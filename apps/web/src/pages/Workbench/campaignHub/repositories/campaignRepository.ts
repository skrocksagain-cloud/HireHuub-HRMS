import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../../../firebase/firebase';
import type { CampaignMaster } from '../types/campaign';
import { MOCK_CAMPAIGNS } from '../constants/campaignConstants';

export class CampaignRepository {
  private collectionName = 'campaignMaster';

  /**
   * Fetches all Campaign Master records from Firestore.
   */
  async getAllCampaigns(): Promise<CampaignMaster[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy('campaignNumber', 'desc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return MOCK_CAMPAIGNS;
      }
      return snapshot.docs.map((docSnap) => docSnap.data() as CampaignMaster);
    } catch {
      // Fallback to local mock array if network/Firestore unavailable
      return MOCK_CAMPAIGNS;
    }
  }

  /**
   * Fetches a single Campaign Master by ID or Campaign Number.
   */
  async getCampaignById(id: string): Promise<CampaignMaster | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as CampaignMaster;
      }
      // Check mock records fallback
      const found = MOCK_CAMPAIGNS.find(
        (c) => c.id === id || c.campaignNumber.toLowerCase() === id.toLowerCase()
      );
      return found || null;
    } catch {
      const found = MOCK_CAMPAIGNS.find(
        (c) => c.id === id || c.campaignNumber.toLowerCase() === id.toLowerCase()
      );
      return found || null;
    }
  }

  /**
   * Creates a new Campaign Master record in Firestore.
   */
  async createCampaign(campaign: CampaignMaster): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, campaign.id);
      await setDoc(docRef, campaign);
    } catch {
      // Local fallback push for session preview
      MOCK_CAMPAIGNS.unshift(campaign);
    }
  }

  /**
   * Updates an existing Campaign Master record in Firestore.
   */
  async updateCampaign(id: string, updates: Partial<CampaignMaster>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, updates);
    } catch {
      const idx = MOCK_CAMPAIGNS.findIndex((c) => c.id === id);
      if (idx !== -1) {
        MOCK_CAMPAIGNS[idx] = { ...MOCK_CAMPAIGNS[idx], ...updates };
      }
    }
  }
}

export const campaignRepository = new CampaignRepository();
