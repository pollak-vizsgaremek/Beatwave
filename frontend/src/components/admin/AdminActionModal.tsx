import { X } from "lucide-react";
import type { ReactNode } from "react";

interface AdminActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  isSubmitting?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

const AdminActionModal = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = false,
  isSubmitting = false,
  confirmDisabled = false,
  children,
  onConfirm,
  onClose,
}: AdminActionModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-gray-900 w-full max-w-lg p-5 rounded-2xl border border-gray-700 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-3 right-3 text-gray-300 hover:text-white disabled:opacity-60 cursor-pointer"
          aria-label="Close action modal"
        >
          <X size={22} />
        </button>

        <h2 className="text-xl font-semibold text-white pr-8">{title}</h2>
        <p className="text-sm text-gray-300 mt-2">{description}</p>

        {children ? <div className="mt-4">{children}</div> : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-60 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || confirmDisabled}
            className={`px-4 py-2 rounded-lg text-white disabled:opacity-60 cursor-pointer ${
              danger
                ? "bg-red-700 hover:bg-red-600"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {isSubmitting ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminActionModal;
