import { InputHTMLAttributes, ReactNode, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  hintTone?: "default" | "success" | "error";
  rightSlot?: ReactNode;
}

export function Input({
  label,
  hint,
  hintTone = "default",
  rightSlot,
  type = "text",
  className = "",
  ...rest
}: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;

  const hintColor =
    hintTone === "success"
      ? "text-success-600"
      : hintTone === "error"
        ? "text-accent-500"
        : "text-ink-400";

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-700">
        {label}
      </span>
      <div className="relative">
        <input
          {...rest}
          type={inputType}
          className={`w-full rounded-xl border border-ink-200 bg-surface-0 px-4 py-3 text-sm font-medium text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-50 ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        {rightSlot && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>
      {hint && <span className={`mt-1.5 block text-xs ${hintColor}`}>{hint}</span>}
    </label>
  );
}
