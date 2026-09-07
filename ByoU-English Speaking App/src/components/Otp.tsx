import { useState, useEffect } from "react";
import { ArrowRight, RefreshCw, PartyPopper } from "lucide-react";
import { Button } from "./Button";
import { AUTH_COPY, APP_CONFIG } from "../config";

interface OtpProps {
  email: string;
  onVerify: () => void;
  onBack: () => void;
}

export function Otp({ email, onVerify, onBack }: OtpProps) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [celebrating, setCelebrating] = useState(false);

  const code = digits.join("");

  const setDigit = (idx: number, val: string) => {
    if (val.length > 1) {
      const chars = val.slice(0, 6).split("");
      const next = ["", "", "", "", "", ""];
      chars.forEach((c, i) => (next[i] = c));
      setDigits(next);
      return;
    }
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 5) {
      const el = document.getElementById(`otp-${idx + 1}`);
      el?.focus();
    }
  };

  const handleKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      const el = document.getElementById(`otp-${idx - 1}`);
      el?.focus();
    }
  };

  const handleVerify = () => {
    if (code === APP_CONFIG.otpCode) {
      setError(false);
      setCelebrating(true);
    } else {
      setError(true);
    }
  };

  useEffect(() => {
    if (celebrating) {
      const timer = setTimeout(() => onVerify(), 2200);
      return () => clearTimeout(timer);
    }
  }, [celebrating, onVerify]);

  const handleResend = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  if (celebrating) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-brand-50 to-surface-1 animate-fade-in">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-500 text-white shadow-pop animate-bounce-in">
          <PartyPopper size={44} />
        </div>
        <h1 className="mt-8 text-3xl font-extrabold text-ink-900 animate-slide-up">
          Account created! 🎉
        </h1>
        <p className="mt-3 max-w-[240px] text-sm text-ink-600 animate-slide-up">
          Welcome to Byo<span className="text-accent-500 font-bold">U</span>. Let's get you speaking with confidence.
        </p>
        <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-brand-500">
          <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-10 animate-fade-in">
      <button
        onClick={onBack}
        className="mb-6 text-sm font-medium text-ink-600 hover:text-ink-800"
      >
        ← Back
      </button>
      <h1 className="text-2xl font-extrabold leading-tight text-ink-900">
        {AUTH_COPY.otp.title}
      </h1>
      <p className="mt-1.5 text-sm text-ink-600">
        {AUTH_COPY.otp.subtitle(email)}
      </p>

      <div className="mt-8 flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => {
              setError(false);
              setDigit(i, e.target.value.replace(/\D/g, ""));
            }}
            onKeyDown={(e) => handleKey(i, e)}
            className={`h-14 w-12 rounded-xl border-2 bg-surface-0 text-center text-xl font-bold text-ink-900 outline-none transition-all focus:ring-4 focus:ring-brand-50 ${
              error
                ? "border-accent-500"
                : d
                  ? "border-brand-500"
                  : "border-ink-200 focus:border-brand-400"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="mt-3 text-xs font-medium text-accent-500 animate-fade-in">
          {AUTH_COPY.otp.wrong}
        </p>
      )}

      <p className="mt-3 text-xs text-ink-600">
        {AUTH_COPY.otp.demoNote}
      </p>

      <Button full className="mt-6" onClick={handleVerify}>
        Verify <ArrowRight size={16} />
      </Button>

      <button
        onClick={handleResend}
        disabled={resendTimer > 0}
        className="mt-4 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-800 disabled:opacity-50"
      >
        <RefreshCw size={14} />
        {resendTimer > 0 ? `Resend in ${resendTimer}s` : AUTH_COPY.otp.resend}
      </button>
    </div>
  );
}
