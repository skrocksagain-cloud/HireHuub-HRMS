import type { Offer } from "../../../types/Offer";

import Button from "../../../ui/Button";

interface ActionPanelProps {
  offer: Offer;

  onBack?: () => void;

  onEdit?: () => void;

  onGenerateOffer?: () => void;

  onDownloadOffer?: () => void;

  onSendEmail?: () => void;

  onAccept?: () => void;

  onReject?: () => void;

  onCreateEmployee?: () => void;

  onDelete?: () => void;
}

export default function ActionPanel({
  offer,
  onBack,
  onEdit,
  onGenerateOffer,
  onDownloadOffer,
  onSendEmail,
  onAccept,
  onReject,
  onCreateEmployee,
  onDelete,
}: ActionPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">

      <h2 className="text-lg font-semibold text-slate-800 mb-6">
        Actions
      </h2>

      <div className="flex flex-col gap-3">

        {onBack && (
          <Button onClick={onBack}>
            Back
          </Button>
        )}

        {onEdit && (
          <Button onClick={onEdit}>
            Edit Offer
          </Button>
        )}

        {offer.status === "Draft" && onGenerateOffer && (
          <Button onClick={onGenerateOffer}>
            Generate Offer Letter
          </Button>
        )}

        {offer.status === "Generated" && (
          <>
            {onDownloadOffer && (
              <Button onClick={onDownloadOffer}>
                Download Offer
              </Button>
            )}

            {onSendEmail && (
              <Button onClick={onSendEmail}>
                Send Offer
              </Button>
            )}
          </>
        )}

        {offer.status === "Sent" && (
          <>
            {onAccept && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={onAccept}
              >
                Accept Offer
              </Button>
            )}

            {onReject && (
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={onReject}
              >
                Reject Offer
              </Button>
            )}
          </>
        )}

        {(offer.status === "Accepted" ||
          offer.status === "Joined") &&
          onCreateEmployee && (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={onCreateEmployee}
            >
              Convert to Employee
            </Button>
          )}

        {onDelete &&
          offer.status !== "Converted" && (
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={onDelete}
            >
              Delete Offer
            </Button>
          )}

        {offer.status === "Converted" && (
          <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-center font-medium text-green-700">
            ✅ Employee Created Successfully
          </div>
        )}

      </div>

    </div>
  );
}