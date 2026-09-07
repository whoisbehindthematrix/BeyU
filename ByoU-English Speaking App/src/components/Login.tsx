import { useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { AUTH_COPY } from "../config";

interface LoginProps {
  onLogin: (email: string, remember: boolean) => void;
  onSwitchSignUp: () => void;
  onForgot: () => void;
}

export function Login({ onLogin, onSwitchSignUp, onForgot }: LoginProps) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pw.trim()) {
      setError(AUTH_COPY.login.invalid);
      return;
    }
    setError("");
    onLogin(email.trim(), remember);
  };

  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-10 animate-fade-in">
      <h1 className="text-2xl font-extrabold leading-tight text-ink-900">
        {AUTH_COPY.login.title}
      </h1>
      <p className="mt-1.5 text-sm text-ink-600">{AUTH_COPY.login.subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          rightSlot={<Mail size={18} className="text-ink-400" />}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Your password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          rightSlot={<Lock size={18} className="text-ink-400" />}
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2">
            <button
              type="button"
              onClick={() => setRemember((r) => !r)}
              className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${
                remember
                  ? "border-brand-500 bg-brand-500"
                  : "border-ink-200 bg-surface-0"
              }`}
            >
              {remember && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5L4 7L8 3"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <span className="text-sm text-ink-600">
              {AUTH_COPY.login.remember}
            </span>
          </label>
          <button
            type="button"
            onClick={onForgot}
            className="text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            {AUTH_COPY.login.forgot}
          </button>
        </div>

        {error && (
          <p className="text-xs font-medium text-accent-500">{error}</p>
        )}

        <Button type="submit" full className="mt-2">
          Log in <ArrowRight size={16} />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600">
        New to Byo<span className="text-accent-500 font-bold">U</span>?{" "}
        <button
          onClick={onSwitchSignUp}
          className="font-semibold text-brand-500 hover:text-brand-600"
        >
          Create an account
        </button>
      </p>
    </div>
  );
}
