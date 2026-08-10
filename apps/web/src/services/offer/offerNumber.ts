import { offerRepository } from './repositories/offerRepository';

export async function generateOfferNumber(): Promise<{ offerId: string }> {
  const offerId = await offerRepository.getNextOfferNumber();
  return { offerId };
}