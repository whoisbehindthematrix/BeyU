import { Check, ArrowRight, X } from "lucide-react";
import { Button } from "./Button";
import type { PlanTier } from "../lib/storage";

interface PlansProps {
  currentPlan: PlanTier;
  onSelectPlan: (plan: PlanTier) => void;
  onBack: () => void;
}

const features = [
  { label: "Week 1 (7 days)", free: true, pro: true },
  { label: "Full 30-day course", free: false, pro: true },
  { label: "All course types", free: false, pro: true },
  { label: "Detailed feedback", free: true, pro: true },
  { label: "Streak & badges", free: true, pro: true },
  { label: "Priority support", free: false, pro: true },
];

export function Plans({ currentPlan, onSelectPlan, onBack }: PlansProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar bg-surface-1">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <button
          onClick={onBack}
          className="tap-target rounded-lg p-2 text-ink-400 hover:bg-surface-2"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-lg font-extrabold text-ink-900">Choose your plan</h1>
      </div>

      <div className="px-5 pb-10 space-y-4">
        {/* Free card */}
        <div
          className={`rounded-2xl border-2 p-5 transition-all ${
            currentPlan === "free"
              ? "border-brand-400 bg-brand-50/40 shadow-soft"
              : "border-ink-200 bg-surface-0"
          }`}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-ink-900">Free</span>
            <span className="text-sm text-ink-500">forever</span>
          </div>
          <p className="mt-1 text-sm text-ink-500">Week 1 of any course, full feedback.</p>
          {currentPlan === "free" && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500">
              <Check size={12} /> Current plan
            </div>
          )}
        </div>

        {/* Pro card */}
        <div
          className={`rounded-2xl border-2 p-5 transition-all ${
            currentPlan === "pro"
              ? "border-brand-400 bg-brand-50/40 shadow-soft"
              : "border-ink-200 bg-surface-0"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-accent-500/15 px-2 py-0.5 text-xs font-bold text-accent-500">
              MOST POPULAR
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-ink-900">$4.99</span>
            <span className="text-sm text-ink-500">/month</span>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Full 30-day course. Switch courses anytime.
          </p>
          {currentPlan === "pro" ? (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500">
              <Check size={12} /> Current plan
            </div>
          ) : (
            <Button
              full
              className="mt-4"
              onClick={() => onSelectPlan("pro")}
            >
              Upgrade to Pro <ArrowRight size={16} />
            </Button>
          )}
        </div>

        {/* Feature comparison */}
        <div className="rounded-2xl bg-surface-0 p-4 shadow-soft">
          <p className="mb-3 text-sm font-bold text-ink-900">What's included</p>
          <div className="space-y-2.5">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-16 flex justify-center">
                  {f.free ? (
                    <Check size={16} className="text-success-500" />
                  ) : (
                    <X size={16} className="text-ink-300" />
                  )}
                </div>
                <span className="flex-1 text-sm text-ink-700">{f.label}</span>
                <div className="w-16 flex justify-center">
                  {f.pro ? (
                    <Check size={16} className="text-success-500" />
                  ) : (
                    <X size={16} className="text-ink-300" />
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 border-t border-ink-100 pt-2">
              <span className="w-16 text-center text-xs font-bold text-ink-500">Free</span>
              <span className="flex-1" />
              <span className="w-16 text-center text-xs font-bold text-brand-500">Pro</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-ink-400">
          Prototype — no real charges. Tap Upgrade to unlock instantly.
        </p>
      </div>
    </div>
  );
}
