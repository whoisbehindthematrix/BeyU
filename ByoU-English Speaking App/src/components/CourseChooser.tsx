import { useState } from "react";
import { ArrowRight, Check, Target, MessageCircle, Rocket } from "lucide-react";
import { Button } from "./Button";
import type { CourseId } from "../lib/storage";
import { COURSES } from "../lib/curriculum";

interface CourseChooserProps {
  onSelect: (courseId: CourseId) => void;
}

const courseList: {
  id: CourseId;
  name: string;
  tagline: string;
  price: string;
  icon: typeof Target;
  popular?: boolean;
}[] = [
  {
    id: "interview",
    name: COURSES.interview.name,
    tagline: COURSES.interview.tagline,
    price: "\u20B999/month",
    icon: Target,
  },
  {
    id: "combined",
    name: COURSES.combined.name,
    tagline: COURSES.combined.tagline,
    price: "\u20B9149/month",
    icon: Rocket,
    popular: true,
  },
  {
    id: "conversation",
    name: COURSES.conversation.name,
    tagline: COURSES.conversation.tagline,
    price: "\u20B999/month",
    icon: MessageCircle,
  },
];

export function CourseChooser({ onSelect }: CourseChooserProps) {
  const [selected, setSelected] = useState<CourseId>("combined");

  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-10 animate-fade-in">
      <h1 className="text-2xl font-extrabold leading-tight text-ink-900">
        What would you like to practise?
      </h1>
      <p className="mt-1.5 text-sm text-ink-600">
        Pick your 30-day course. You can change later.
      </p>

      <div className="mt-7 space-y-3">
        {courseList.map((c) => {
          const Icon = c.icon;
          const isSelected = selected === c.id;
          const isPopular = c.popular;

          return (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`relative flex w-full items-center gap-4 rounded-2xl text-left transition-all active:scale-[0.98] ${
                isPopular ? "p-5" : "p-4"
              } ${
                isSelected
                  ? isPopular
                    ? "bg-accent-500/8 ring-2 ring-accent-400 shadow-card"
                    : "bg-brand-500/10 ring-2 ring-brand-400 shadow-soft"
                  : "bg-surface-0 shadow-soft hover:bg-surface-2"
              }`}
            >
              {/* Most popular pill */}
              {isPopular && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-accent-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  Most popular
                </span>
              )}

              {/* Icon */}
              <div
                className={`flex shrink-0 items-center justify-center rounded-xl ${
                  isPopular ? "h-12 w-12" : "h-10 w-10"
                } ${
                  isSelected
                    ? isPopular
                      ? "bg-accent-500/15 text-accent-500"
                      : "bg-brand-500/15 text-brand-500"
                    : "bg-ink-100 text-ink-500"
                }`}
              >
                <Icon size={isPopular ? 24 : 20} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-ink-900 ${isPopular ? "text-base" : "text-sm"}`}>
                  {c.name}
                </p>
                <p className="mt-0.5 text-xs text-ink-600">{c.tagline}</p>
                <p className={`mt-1 text-xs font-semibold ${
                  isSelected
                    ? isPopular ? "text-accent-500" : "text-brand-500"
                    : "text-ink-600"
                }`}>
                  {c.price}
                </p>
              </div>

              {/* Check */}
              {isSelected && (
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-white animate-scale-in ${
                  isPopular ? "bg-accent-500" : "bg-brand-500"
                }`}>
                  <Check size={14} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-8">
        <Button
          full
          onClick={() => onSelect(selected)}
        >
          Start your course <ArrowRight size={16} />
        </Button>
        <p className="mt-3 text-center text-xs text-ink-600">
          Week 1 is free — no card needed
        </p>
      </div>
    </div>
  );
}
