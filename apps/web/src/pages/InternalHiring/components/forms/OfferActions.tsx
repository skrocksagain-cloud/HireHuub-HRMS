import Button from "../../../../ui/Button";

interface OfferActionsProps {
  loading?: boolean;

  onSave: () => void;

  onCancel: () => void;

  onPreview?: () => void;

  onGenerate?: () => void;
}

export default function OfferActions({
  loading = false,
  onSave,
  onCancel,
  onPreview,
  onGenerate,
}: OfferActionsProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">

      <div className="flex flex-wrap justify-end gap-3">

        {/* Cancel */}

        <Button
          onClick={onCancel}
        >
          Cancel
        </Button>

        {/* Preview */}

        <Button
          onClick={onPreview}
          disabled={!onPreview}
        >
          Preview PDF
        </Button>

        {/* Generate */}

        <Button
          onClick={onGenerate}
          disabled={!onGenerate}
        >
          Generate Offer
        </Button>

        {/* Save */}

        <Button
          onClick={onSave}
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : "Save Offer"}
        </Button>

      </div>

    </div>
  );
}