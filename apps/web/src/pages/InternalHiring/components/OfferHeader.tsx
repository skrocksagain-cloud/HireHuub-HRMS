import type { Offer } from "../../../types/Offer";

import Badge from "../../../ui/Badge";
import Button from "../../../ui/Button";

interface OfferHeaderProps {
  offer: Offer;
  onEdit?: () => void;
}

export default function OfferHeader({
  offer,
  onEdit,
}: OfferHeaderProps) {
  function getBadgeVariant(
    status: Offer["status"]
  ):
    | "success"
    | "danger"
    | "warning"
    | "secondary"
    | "info" {
    switch (status) {
      case "Accepted":
      case "Joined":
      case "Converted":
        return "success";

      case "Rejected":
        return "danger";

      case "Generated":
        return "warning";

      case "Sent":
        return "info";

      default:
        return "secondary";
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

      <div>

        <p className="text-sm text-slate-500">
          Offer Number
        </p>

        <h1 className="text-2xl font-bold text-slate-800">
          {offer.offerId}
        </h1>

        <p className="mt-2 text-lg font-semibold text-slate-700">
          {offer.fullName}
        </p>

        <p className="text-sm text-slate-500">
          {offer.designationName}
        </p>

      </div>

      <div className="flex items-center gap-4">

        <Badge
          variant={getBadgeVariant(
            offer.status
          )}
        >
          {offer.status}
        </Badge>

        <Button
          onClick={onEdit}
        >
          Edit Offer
        </Button>

      </div>

    </div>
  );
}