import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { adminService } from '../../admin/adminService';
import type { Offer } from '../../../types/Offer';

const OFFERS_COLLECTION = 'offers';
const COUNTERS_COLLECTION = 'offer_counters';

class OfferRepository {
  async getOffers(): Promise<Offer[]> {
    try {
      const snap = await getDocs(collection(db, OFFERS_COLLECTION));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Offer, 'id'>) }));
    } catch {
      return [];
    }
  }

  async getOfferById(id: string): Promise<Offer | null> {
    try {
      const docRef = doc(db, OFFERS_COLLECTION, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as Omit<Offer, 'id'>) };
    } catch {
      return null;
    }
  }

  async saveOffer(offer: Omit<Offer, 'id'> & { id?: string }): Promise<Offer> {
    const offerId = offer.id || `off_${Date.now()}`;
    const docRef = doc(db, OFFERS_COLLECTION, offerId);
    const now = new Date().toISOString();

    const payload: Offer = {
      ...offer,
      id: offerId,
      createdAt: offer.createdAt || now,
      updatedAt: now,
    };

    await setDoc(docRef, payload, { merge: true });
    return payload;
  }

  async deleteOffer(id: string): Promise<void> {
    await deleteDoc(doc(db, OFFERS_COLLECTION, id));
  }

  async getNextOfferNumber(): Promise<string> {
    const company = await adminService.getCompanySettings();
    if (!company.offerPrefix?.trim()) {
      throw new Error('Administration → Company Settings is missing the offer prefix.');
    }
    const year = new Date().getFullYear();
    const counterRef = doc(db, COUNTERS_COLLECTION, `${year}`);

    const count = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let newCount = 1;
      if (counterDoc.exists()) {
        newCount = (counterDoc.data().count || 0) + 1;
      }
      transaction.set(counterRef, { count: newCount }, { merge: true });
      return newCount;
    });

    return `${company.offerPrefix}${year}-${String(count).padStart(4, '0')}`;
  }
}

export const offerRepository = new OfferRepository();
