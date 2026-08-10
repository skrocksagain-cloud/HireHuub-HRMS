import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../../firebase/firebase';
import type { CampaignMaster } from '../types/campaign';

export class CampaignRepository {
  private collectionName = 'campaigns';

  async getAllCampaigns(): Promise<CampaignMaster[]> {
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<CampaignMaster, 'id'>) }));
    } catch {
      return [];
    }
  }

  async getCampaignById(id: string): Promise<CampaignMaster | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...(docSnap.data() as Omit<CampaignMaster, 'id'>) };
      }
      return null;
    } catch {
      return null;
    }
  }

  async createCampaign(campaign: CampaignMaster): Promise<void> {
    const docRef = doc(db, this.collectionName, campaign.id);
    await setDoc(docRef, campaign, { merge: true });
  }

  async updateCampaign(id: string, updates: Partial<CampaignMaster>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, updates);
  }
}

export const campaignRepository = new CampaignRepository();
