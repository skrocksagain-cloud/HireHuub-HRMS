import { createElement } from 'react';

import OfferLetterPdf from '../../templates/pdf/OfferLetterPdf';
import type { Offer } from '../../types/Offer';
import type { DocumentGenerationRequest } from '../../types/DocumentGenerationRequest';

export interface DocumentTemplateDefinition<TPayload> {
  id: string;
  title: string;
  createRequest: (payload: TPayload) => DocumentGenerationRequest<TPayload>;
}

const OFFER_LETTER_DOCUMENT_TYPE = 'Offer Letter';
const OFFER_LETTER_FILE_PREFIX = 'Offer_Letter';
const INITIAL_DOCUMENT_VERSION = 1;

export const offerLetterDocumentTemplate: DocumentTemplateDefinition<Offer> = {
  id: 'offer-letter',
  title: OFFER_LETTER_DOCUMENT_TYPE,
  createRequest: (offer) => ({
    documentType: OFFER_LETTER_DOCUMENT_TYPE,
    module: 'Offer',
    referenceId: offer.offerId,
    fileName: `${OFFER_LETTER_FILE_PREFIX}_${offer.offerId}`,
    version: INITIAL_DOCUMENT_VERSION,
    generatedBy: offer.createdBy,
    payload: offer,
    template: createElement(OfferLetterPdf, { offer }),
  }),
};
