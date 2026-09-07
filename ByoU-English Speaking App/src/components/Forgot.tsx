import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { AUTH_COPY } from "../config";

interface ForgotProps {
  onBack: () => void;
}

export function Forgot({ onBack }: ForgotProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 pb-8 pt-10 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-500/10 text-success-500">
          <Check size={32} />
        </div>
        <h1 className="mt-6 text-xl font-bold text-ink-900">Check your email</h1>
        <p className="mt-2 text-center text-sm text-ink-500">
          {AUTH_COPY.forgot.sent}
        </p>
        <Button full className="mt-8" onClick={onBack}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-10 animate-fade-in">
      <button
        onClick={onBack}
        className="mb-6 text-sm font-medium text-ink-400 hover:text-ink-600"
      >
        ← Back to login
      </button>
      <h1 className="text-2xl font-extrabold leading-tight text-ink-900">
        {AUTH_COPY.forgot.title}
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">{AUTH_COPY.forgot.subtitle}</p>

      <div className="mt-7 space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button full className="mt-2" onClick={() => setSent(true)}>
          Send reset link <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
