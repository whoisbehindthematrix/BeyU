import { ReactNode } from "react";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-surface-0 p-6 pb-8 shadow-card animate-slide-up sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-lg font-bold text-ink-900">{title}</h3>}
          <button
            onClick={onClose}
            className="tap-target ml-auto rounded-lg p-2 text-ink-400 hover:bg-surface-2"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
