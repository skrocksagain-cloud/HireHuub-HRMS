import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";

import type { Offer } from "../../types/Offer";

import { generateOfferNumber } from "./offerNumber";

const COLLECTION_NAME = "offerLetters";

/**
 * ==========================================
 * Get All Offers
 * ==========================================
 */
export async function getOffers(): Promise<Offer[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Offer),
  }));
}

/**
 * ==========================================
 * Get Single Offer
 * ==========================================
 */
export async function getOffer(
  id: string
): Promise<Offer | null> {
  const snapshot = await getDoc(
    doc(db, COLLECTION_NAME, id)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Offer),
  };
}

/**
 * ==========================================
 * Create Offer
 * ==========================================
 */
export async function createOffer(
  offer: Offer
): Promise<string> {
  const { offerId } =
    await generateOfferNumber();

  const fullName = [
    offer.firstName,
    offer.middleName,
    offer.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const document = await addDoc(
    collection(db, COLLECTION_NAME),
    {
      ...offer,

      offerId,

      fullName,

      createdAt: serverTimestamp(),

      updatedAt: serverTimestamp(),
    }
  );

  return document.id;
}

/**
 * ==========================================
 * Update Offer
 * ==========================================
 */
export async function updateOffer(
  id: string,
  offer: Offer
): Promise<void> {
  const fullName = [
    offer.firstName,
    offer.middleName,
    offer.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  await updateDoc(
    doc(db, COLLECTION_NAME, id),
    {
      ...offer,

      fullName,

      updatedAt: serverTimestamp(),
    }
  );
}

/**
 * ==========================================
 * Delete Offer
 * ==========================================
 */
export async function deleteOffer(
  id: string
): Promise<void> {
  await deleteDoc(
    doc(db, COLLECTION_NAME, id)
  );
}

/**
 * ==========================================
 * Update Offer Status
 * ==========================================
 */
export async function updateOfferStatus(
  id: string,
  status: Offer["status"]
): Promise<void> {
  await updateDoc(
    doc(db, COLLECTION_NAME, id),
    {
      status,

      updatedAt: serverTimestamp(),
    }
  );
}