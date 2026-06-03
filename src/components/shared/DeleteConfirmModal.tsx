import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  open        : boolean;
  title       : string;
  message     : string;
  confirmLabel?: string;
  variant     ?: "danger" | "warning";
  loading     ?: boolean;
  onConfirm   : () => void;
  onClose     : () => void;
}

export default function DeleteConfirmModal({
  open, title, message, confirmLabel = "Delete",
  variant = "danger", loading = false,
  onConfirm, onClose,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-xl shadow-xl w-[400px] p-6">

        {/* Icon + Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isDanger ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
          }`}>
            {isDanger
              ? <Trash2 className="h-5 w-5" />
              : <AlertTriangle className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-[15px] text-foreground">{title}</h3>
            <p className="text-[13px] text-nc-muted mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5 justify-end mt-5">
          <button
            className="btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 text-[13px] font-semibold rounded-lg text-white transition-colors disabled:opacity-50 ${
              isDanger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
