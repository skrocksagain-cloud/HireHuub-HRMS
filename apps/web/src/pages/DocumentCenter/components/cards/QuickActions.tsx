import Card from "../../../../ui/Card";
import Button from "../../../../ui/Button";

interface QuickActionsProps {
  onGenerateOfferLetter?: () => void;

  onGeneratePayslip?: () => void;

  onGenerateIncrementLetter?: () => void;

  onGenerateRelievingLetter?: () => void;

  onUploadDocument?: () => void;

  onOpenTemplates?: () => void;
}

export default function QuickActions({
  onGenerateOfferLetter,
  onGeneratePayslip,
  onGenerateIncrementLetter,
  onGenerateRelievingLetter,
  onUploadDocument,
  onOpenTemplates,
}: QuickActionsProps) {
  return (
    <Card>

      <h2 className="text-xl font-semibold text-slate-800">
        Quick Actions
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Frequently used document operations.
      </p>

      <div className="mt-6 space-y-3">

        <Button
          className="w-full justify-start"
          onClick={onGenerateOfferLetter}
        >
          📄 Generate Offer Letter
        </Button>

        <Button
          className="w-full justify-start"
          onClick={onGeneratePayslip}
        >
          💰 Generate Payslip
        </Button>

        <Button
          className="w-full justify-start"
          onClick={onGenerateIncrementLetter}
        >
          📈 Generate Increment Letter
        </Button>

        <Button
          className="w-full justify-start"
          onClick={onGenerateRelievingLetter}
        >
          🚪 Generate Relieving Letter
        </Button>

        <Button
          className="w-full justify-start"
          onClick={onUploadDocument}
        >
          ☁ Upload Existing Document
        </Button>

        <Button
          className="w-full justify-start"
          onClick={onOpenTemplates}
        >
          🧩 Template Manager
        </Button>

      </div>

    </Card>
  );
}