import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;

  onClose: () => void;

  footer?: ReactNode;

  width?: "sm" | "md" | "lg" | "xl" | "2xl";

  closeOnOverlay?: boolean;
}

const widths = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  "2xl": "max-w-7xl",
};

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  width = "md",
  closeOnOverlay = true,
}: ModalProps) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* Overlay */}

      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (closeOnOverlay) {
            onClose();
          }
        }}
      />

      {/* Modal */}

      <div
        className={`
          relative
          z-10
          mx-4
          w-full
          ${widths[width]}
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
          animate-in
          fade-in
          zoom-in-95
        `}
      >

        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

          <h2 className="text-xl font-semibold text-slate-800">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-slate-100"
          >
            <X size={20} />
          </button>

        </div>

        {/* Body */}

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}

        {footer && (
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            {footer}
          </div>
        )}

      </div>

    </div>
  );
}