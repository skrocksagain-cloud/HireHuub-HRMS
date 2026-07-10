import { AlertTriangle } from "lucide-react";

import Button from "./Button";
import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;

  title?: string;

  message: string;

  confirmText?: string;

  cancelText?: string;

  loading?: boolean;

  variant?: "danger" | "primary";

  onConfirm: () => void;

  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = "Confirm Action",
  message,

  confirmText = "Confirm",
  cancelText = "Cancel",

  loading = false,

  variant = "danger",

  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      width="sm"
      closeOnOverlay={!loading}
      footer={
        <>
          <Button
            onClick={onCancel}
            disabled={loading}
            className="bg-slate-500 hover:bg-slate-600"
          >
            {cancelText}
          </Button>

          <Button
            onClick={onConfirm}
            disabled={loading}
            className={
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : ""
            }
          >
            {loading ? "Please wait..." : confirmText}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">

        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle size={32} />
        </div>

        <p className="text-slate-600">
          {message}
        </p>

      </div>
    </Modal>
  );
}