import { ArrowRight } from "lucide-react";
import { Button } from "./Button";
import { AUTH_COPY } from "../config";

interface WelcomeProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function Welcome({ onGetStarted, onLogin }: WelcomeProps) {
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-brand-500 via-brand-600 to-ink-900 px-6 pb-10 pt-16 text-white">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <span className="text-xl font-extrabold">B</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Byo<span className="text-accent-400">U</span>
          </span>
        </div>

        <h1 className="whitespace-pre-line text-4xl font-extrabold leading-[1.15] tracking-tight">
          {AUTH_COPY.welcome.title}
        </h1>
        <p className="mt-4 max-w-[280px] text-base leading-relaxed text-white/80">
          {AUTH_COPY.welcome.subtitle}
        </p>

        <div className="mt-10 space-y-3">
          {[
            "Practice speaking in 5 minutes a day",
            "Gentle, private feedback — never harsh",
            "Build a streak and earn rewards",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-white/90">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Button
          full
          variant="secondary"
          className="!bg-white !text-brand-600 !shadow-pop"
          onClick={onGetStarted}
        >
          Get started <ArrowRight size={16} />
        </Button>
        <p className="text-center text-xs font-medium text-white/70">
          Week 1 free — no card needed
        </p>
        <button
          onClick={onLogin}
          className="w-full py-2 text-sm font-semibold text-white/80 hover:text-white"
        >
          I already have an account
        </button>
      </div>
    </div>
  );
}
