import { useState } from "react";
import { Home, Mic, MessageSquareText, Trophy, X } from "lucide-react";
import { ONBOARDING_TOUR } from "../config";
import { Button } from "./Button";

const iconMap: Record<string, typeof Home> = {
  home: Home,
  mic: Mic,
  feedback: MessageSquareText,
  trophy: Trophy,
};

interface TourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: TourProps) {
  const [step, setStep] = useState(0);
  const total = ONBOARDING_TOUR.length;
  const current = ONBOARDING_TOUR[step];
  const Icon = iconMap[current.icon] ?? Home;

  const handleNext = () => {
    if (step < total - 1) setStep(step + 1);
    else onComplete();
  };

  const handleSkip = () => onComplete();

  return (
    <div className="relative flex min-h-full flex-col bg-gradient-to-b from-surface-0 to-surface-1 px-6 pb-10 pt-16">
      <button
        onClick={handleSkip}
        className="absolute right-5 top-12 rounded-lg p-2 text-ink-400 hover:bg-surface-2"
      >
        <X size={20} />
      </button>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-500 shadow-soft animate-scale-in" key={step}>
          <Icon size={44} strokeWidth={1.8} />
        </div>

        <div className="mt-8 flex items-center gap-1.5">
          {ONBOARDING_TOUR.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-brand-500"
                  : i < step
                    ? "w-4 bg-brand-300"
                    : "w-1.5 bg-ink-200"
              }`}
            />
          ))}
        </div>

        <h2
          key={`t-${step}`}
          className="mt-6 text-2xl font-extrabold text-ink-900 animate-slide-up"
        >
          {current.title}
        </h2>
        <p
          key={`b-${step}`}
          className="mt-3 max-w-[260px] text-sm leading-relaxed text-ink-600 animate-slide-up"
        >
          {current.body}
        </p>
      </div>

      <Button full onClick={handleNext}>
        {step < total - 1 ? "Next" : "Start practising"}
      </Button>
      {step < total - 1 && (
        <button
          onClick={handleSkip}
          className="mt-3 w-full py-2 text-sm font-medium text-ink-600 hover:text-ink-800"
        >
          Skip tour
        </button>
      )}
    </div>
  );
}
