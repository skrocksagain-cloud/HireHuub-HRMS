import { useCallback, useEffect, useState } from "react";

import type { Offer } from "../../types/Offer";

import { getOffer } from "../../services/offer/offerService";

import OfferHeader from "./components/OfferHeader";
import ProgressTracker from "./components/ProgressTracker";

import CandidateCard from "./components/cards/CandidateCard";
import EmploymentCard from "./components/cards/EmploymentCard";
import SalaryCard from "./components/cards/SalaryCard";
import TimelineCard from "./components/cards/TimelineCard";

import ActionPanel from "./components/ActionPanel";

interface OfferProfileProps {
  offerId: string;

  onBack?: () => void;

  onEdit?: (offer: Offer) => void;
}

export default function OfferProfile({
  offerId,
  onBack,
  onEdit,
}: OfferProfileProps) {
  const [loading, setLoading] = useState(true);

  const [offer, setOffer] = useState<Offer | null>(null);

  const loadOffer = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getOffer(offerId);

      if (data) {
        setOffer(data);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    loadOffer();
  }, [loadOffer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        Loading Offer...
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">

        <h2 className="text-xl font-semibold text-red-600">
          Offer Not Found
        </h2>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      <OfferHeader
        offer={offer}
      />

      <ProgressTracker
        status={offer.status}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2 space-y-6">

          <CandidateCard
            offer={offer}
          />

          <EmploymentCard
            offer={offer}
          />

          <SalaryCard
            offer={offer}
          />

          <TimelineCard
            offer={offer}
          />

        </div>

        <div>

          <ActionPanel
            offer={offer}
            onBack={onBack}
            onEdit={() => onEdit?.(offer)}
          />

        </div>

      </div>

    </div>
  );
}