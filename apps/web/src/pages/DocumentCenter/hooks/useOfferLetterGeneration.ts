import { useCallback, useEffect, useState } from 'react';

import { getOffers } from '../../../services/offer/offerService';
import type { Offer } from '../../../types/Offer';
import { offerLetterDocumentTemplate } from '../documentTemplates';
import { validateOfferLetter } from '../offerLetterValidation';
import { useDocumentGeneration } from './useDocumentGeneration';

interface UseOfferLetterGenerationResult {
  offers: Offer[];
  isLoadingOffers: boolean;
  isGenerating: boolean;
  error: string | null;
  generatedFileName: string | null;
  generateOfferLetter: (offerId: string) => Promise<void>;
}

const UNKNOWN_GENERATION_ERROR = 'Unable to generate the offer letter.';

export const useOfferLetterGeneration = (): UseOfferLetterGenerationResult => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [generatedFileName, setGeneratedFileName] = useState<string | null>(null);
  const {
    loading: isGenerating,
    error: generationError,
    generateDocument,
    reset,
  } = useDocumentGeneration();

  const loadOffers = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingOffers(true);
      setOfferError(null);
      setOffers(await getOffers());
    } catch (loadError: unknown) {
      const message = loadError instanceof Error
        ? loadError.message
        : 'Unable to load offers for document generation.';

      setOfferError(message);
    } finally {
      setIsLoadingOffers(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadOffers();
    });

    return () => window.clearTimeout(loadTimer);
  }, [loadOffers]);

  const generateOfferLetter = async (offerId: string): Promise<void> => {
    reset();
    setOfferError(null);
    setGeneratedFileName(null);

    const offer = offers.find((currentOffer) => currentOffer.id === offerId);

    if (!offer) {
      setOfferError('Select a valid offer before generating the document.');
      return;
    }

    const validationError = validateOfferLetter(offer);

    if (validationError) {
      setOfferError(validationError);
      return;
    }

    const result = await generateDocument(
      offerLetterDocumentTemplate.createRequest(offer),
    );

    if (!result.success) {
      setOfferError(result.error ?? UNKNOWN_GENERATION_ERROR);
      return;
    }

    setGeneratedFileName(result.fileName ?? null);
  };

  return {
    offers,
    isLoadingOffers,
    isGenerating,
    error: offerError ?? generationError,
    generatedFileName,
    generateOfferLetter,
  };
};
