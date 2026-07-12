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
    } catch (error) {
      console.error(error);

      alert("Unable to load offers.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DataTable
      data={offers}
      loading={loading}
      columns={getOfferColumns({
        onView: (offer) => {
          console.log("View", offer);
        },

        onEdit: (offer) => {
          console.log("Edit", offer);
        },

        onDelete: (offer) => {
          console.log("Delete", offer);
        },
      })}
      emptyTitle="No Offers Found"
      emptyDescription="Create your first internal offer to get started."
      onRefresh={loadOffers}
    />
  );
}