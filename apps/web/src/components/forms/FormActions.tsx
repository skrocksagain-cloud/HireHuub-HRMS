import Button from "../../ui/Button";

interface FormActionsProps {
  saving?: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveText?: string;
}

export default function FormActions({
  saving = false,
  onCancel,
  onSave,
  saveText = "Save",
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-4 mt-8">
      <Button
        className="bg-gray-500 hover:bg-gray-600"
        onClick={onCancel}
      >
        Cancel
      </Button>

      <Button
        onClick={onSave}
        disabled={saving}
      >
        {saving ? "Saving..." : saveText}
      </Button>
    </div>
  );
}