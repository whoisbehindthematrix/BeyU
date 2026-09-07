import { useState } from "react";
import { Mail, User, ArrowRight, Check } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { AUTH_COPY } from "../config";
import type { UserSession } from "../lib/storage";

interface SignUpProps {
  onSignUp: (user: UserSession) => void;
  onGoogleSignUp: () => void;
  onSwitchLogin: () => void;
}

export function SignUp({ onSignUp, onGoogleSignUp, onSwitchLogin }: SignUpProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [consentVoice, setConsentVoice] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [helper, setHelper] = useState("");

  const pwValid = pw.length >= 8;
  const canSubmit = name.trim() && email.trim() && pwValid && consentVoice && consentTerms;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!consentVoice || !consentTerms) setHelper("Please check both boxes to continue.");
      else setHelper("Please fill in all fields.");
      return;
    }
    setHelper("");
    onSignUp({
      id: crypto.randomUUID(),
      email: email.trim(),
      name: name.trim(),
      goal: "",
      createdAt: Date.now(),
      courseId: null,
      plan: "free",
    });
  };

  const consentLines = AUTH_COPY.signup.consentText.split("\n");

  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-10 animate-fade-in overflow-y-auto no-scrollbar">
      <h1 className="text-2xl font-extrabold leading-tight text-ink-900">
        {AUTH_COPY.signup.title}
      </h1>
      <p className="mt-1.5 text-sm text-ink-600">{AUTH_COPY.signup.subtitle}</p>

      {/* Google sign-in */}
      <button
        onClick={onGoogleSignUp}
        className="tap-target mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl border border-ink-200 bg-surface-0 px-5 py-3 text-sm font-semibold text-ink-800 shadow-soft transition-all hover:bg-surface-2 active:scale-[0.98]"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-200" />
        <span className="text-xs font-medium text-ink-500">or</span>
        <div className="h-px flex-1 bg-ink-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          rightSlot={<User size={18} className="text-ink-400" />}
        />
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
          placeholder="At least 8 characters"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          hint={
            pw.length === 0
              ? undefined
              : pwValid
                ? AUTH_COPY.signup.ok
                : AUTH_COPY.signup.weak
          }
          hintTone={pwValid ? "success" : "error"}
        />

        {/* Consent block */}
        <div className="rounded-xl bg-surface-2 p-3.5">
          <p className="text-xs font-semibold text-ink-700">
            Before we start:
          </p>
          <ul className="mt-1.5 space-y-1">
            {consentLines.slice(1).map((line, i) => (
              <li key={i} className="text-xs leading-relaxed text-ink-600">
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* Voice consent checkbox */}
        <label className="flex cursor-pointer items-start gap-3">
          <button
            type="button"
            onClick={() => setConsentVoice((c) => !c)}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
              consentVoice
                ? "border-brand-500 bg-brand-500"
                : "border-ink-300 bg-surface-0"
            }`}
          >
            {consentVoice && <Check size={12} className="text-white" />}
          </button>
          <span className="text-sm font-medium text-ink-700">
            {AUTH_COPY.signup.consentLabelVoice}
          </span>
        </label>

        {/* Terms consent checkbox */}
        <label className="flex cursor-pointer items-start gap-3 !mt-2">
          <button
            type="button"
            onClick={() => setConsentTerms((c) => !c)}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
              consentTerms
                ? "border-brand-500 bg-brand-500"
                : "border-ink-300 bg-surface-0"
            }`}
          >
            {consentTerms && <Check size={12} className="text-white" />}
          </button>
          <span className="text-sm font-medium text-ink-700">
            {AUTH_COPY.signup.consentLabelTerms}
          </span>
        </label>

        {helper && (
          <p className="text-xs font-medium text-accent-500">{helper}</p>
        )}

        <Button
          type="submit"
          full
          disabled={!canSubmit}
          className="mt-1"
        >
          Create account <ArrowRight size={16} />
        </Button>
        {!canSubmit && !helper && (
          <p className="text-center text-xs text-ink-600">
            Fill in all fields and check both boxes to continue
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-ink-600">
        Already have an account?{" "}
        <button
          onClick={onSwitchLogin}
          className="font-semibold text-brand-500 hover:text-brand-600"
        >
          Log in
        </button>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
