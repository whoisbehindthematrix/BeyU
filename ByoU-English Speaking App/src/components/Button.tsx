import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-pop hover:bg-brand-600 active:scale-[0.98]",
  secondary:
    "bg-surface-0 text-ink-800 border border-ink-200 shadow-soft hover:bg-surface-2 active:scale-[0.98]",
  ghost: "text-ink-600 hover:bg-surface-2 active:scale-[0.98]",
  danger:
    "bg-accent-500 text-white shadow-soft hover:bg-accent-600 active:scale-[0.98]",
};

export function Button({
  variant = "primary",
  full,
  children,
  className = "",
  disabled,
  ...rest
}: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`tap-target inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
