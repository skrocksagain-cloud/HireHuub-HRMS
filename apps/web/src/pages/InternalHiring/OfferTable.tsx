import { useEffect, useState } from "react";

import type { Offer } from "../../types/Offer";

import { DataTable } from "../../ui/DataTable";

import { getOfferColumns } from "./OfferColumns";

import { getOffers } from "../../services/offer/offerService";

export default function OfferTable() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    try {
      setLoading(true);

      const data = await getOffers();

      setOffers(data);
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DataTable
      data={offers}
      loading={loading}
      columns={getOfferColumns({
        onView: () => {},
        onEdit: () => {},
        onDelete: () => {},
      })}
      emptyTitle="No Offers Found"
      emptyDescription="Create your first internal offer to get started."
      onRefresh={loadOffers}
    />
  );
}