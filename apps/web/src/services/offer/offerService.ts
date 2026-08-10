import { offerRepository } from './repositories/offerRepository';
import type { Offer } from '../../types/Offer';

export async function getOffers(): Promise<Offer[]> {
  return offerRepository.getOffers();
}

export async function getOffer(id: string): Promise<Offer | null> {
  return offerRepository.getOfferById(id);
}

export async function createOffer(offer: Offer): Promise<string> {
  const fullName = [offer.firstName, offer.middleName, offer.lastName].filter(Boolean).join(' ');
  const saved = await offerRepository.saveOffer({
    ...offer,
    fullName,
  });
  return saved.id || '';
}

export async function updateOffer(id: string, offer: Offer): Promise<void> {
  const fullName = [offer.firstName, offer.middleName, offer.lastName].filter(Boolean).join(' ');
  await offerRepository.saveOffer({
    ...offer,
    id,
    fullName,
  });
}

export async function deleteOffer(id: string): Promise<void> {
  await offerRepository.deleteOffer(id);
}

export async function updateOfferStatus(id: string, status: Offer['status']): Promise<void> {
  const existing = await offerRepository.getOfferById(id);
  if (existing) {
    await offerRepository.saveOffer({
      ...existing,
      status,
    });
  }
}