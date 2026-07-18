import { useState } from 'react';

import type { Offer } from '../../../types/Offer';
import Button from '../../../ui/Button';
import Card from '../../../ui/Card';

interface OfferLetterGeneratorProps {
  offers: Offer[];
  isLoadingOffers: boolean;
  isGenerating: boolean;
  error: string | null;
  generatedFileName: string | null;
  onGenerate: (offerId: string) => Promise<void>;
}

const OFFER_SELECTION_PLACEHOLDER = '';

export default function OfferLetterGenerator({
  offers,
  isLoadingOffers,
  isGenerating,
  error,
  generatedFileName,
  onGenerate,
}: OfferLetterGeneratorProps) {
  const [selectedOfferId, setSelectedOfferId] = useState(
    OFFER_SELECTION_PLACEHOLDER,
  );

  const handleGenerate = (): void => {
    void onGenerate(selectedOfferId);
  };

  const isGenerateDisabled = isLoadingOffers || isGenerating || offers.length === 0;

  return (
    <Card>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-slate-800">
            Generate Offer Letter
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select a saved offer to download its PDF using the current offer data.
          </p>

          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="offer-letter">
            Offer
          </label>
          <select
            id="offer-letter"
            value={selectedOfferId}
            disabled={isGenerateDisabled}
            onChange={(event) => setSelectedOfferId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value={OFFER_SELECTION_PLACEHOLDER}>
              {isLoadingOffers ? 'Loading offers...' : 'Select an offer'}
            </option>
            {offers.map((offer) => (
              <option key={offer.id ?? offer.offerId} value={offer.id ?? ''}>
                {offer.offerId} — {offer.fullName}
              </option>
            ))}
          </select>
        </div>

        <Button disabled={isGenerateDisabled} onClick={handleGenerate}>
          {isGenerating ? 'Generating PDF...' : 'Generate & Download PDF'}
        </Button>
      </div>

      {offers.length === 0 && !isLoadingOffers && !error ? (
        <p className="mt-4 text-sm text-slate-500">
          No saved offers are available for PDF generation.
        </p>
      ) : null}

      {isGenerating ? (
        <p aria-live="polite" className="mt-4 text-sm text-blue-700">
          Preparing your offer letter for download...
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {generatedFileName ? (
        <p aria-live="polite" className="mt-4 text-sm text-green-700">
          {generatedFileName} has been downloaded successfully.
        </p>
      ) : null}
    </Card>
  );
}
