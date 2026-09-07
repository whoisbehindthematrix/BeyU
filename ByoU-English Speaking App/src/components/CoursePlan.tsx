import { useState } from "react";
import { ChevronDown, Lock, Check, Play, Star } from "lucide-react";
import type { CourseId, ProgressState } from "../lib/storage";
import { FREE_TIER_MAX_DAY } from "../lib/storage";
import { COURSES, MOCK_DAYS } from "../lib/curriculum";
import type { CourseCurriculum, WeekBlock } from "../lib/curriculum";

interface CoursePlanProps {
  courseId: CourseId;
  progress: ProgressState;
  plan: "free" | "pro";
  onStartDay: (day: number) => void;
  onUpgrade: () => void;
  onBack: () => void;
}

export function CoursePlan({ courseId, progress, plan, onStartDay, onUpgrade, onBack }: CoursePlanProps) {
  const course: CourseCurriculum = COURSES[courseId];
  const [expanded, setExpanded] = useState<number>(
    course.weeks.findIndex((w) => w.days.some((d) => d.day === progress.courseDay)) + 1 || 1,
  );

  const pct = Math.round((progress.completedDays.length / 30) * 100);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-surface-1">
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
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-lg font-extrabold text-ink-900">
            {course.emoji} {course.name}
          </h1>
          <p className="text-xs text-ink-500">
            Day {progress.courseDay} of 30 &middot; {pct}% complete
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-4">
        <div className="h-2 rounded-full bg-ink-200">
          <div
            className="h-2 rounded-full bg-brand-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Week accordion */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-24 space-y-3">
        {course.weeks.map((week) => (
          <WeekSection
            key={week.week}
            week={week}
            expanded={expanded === week.week}
            onToggle={() => setExpanded(expanded === week.week ? 0 : week.week)}
            completedDays={progress.completedDays}
            currentDay={progress.courseDay}
            dayScores={progress.dayScores}
            plan={plan}
            onStartDay={onStartDay}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>
    </div>
  );
}

function WeekSection({
  week,
  expanded,
  onToggle,
  completedDays,
  currentDay,
  dayScores,
  plan,
  onStartDay,
  onUpgrade,
}: {
  week: WeekBlock;
  expanded: boolean;
  onToggle: () => void;
  completedDays: number[];
  currentDay: number;
  dayScores: Record<number, number>;
  plan: "free" | "pro";
  onStartDay: (day: number) => void;
  onUpgrade: () => void;
}) {
  const doneCount = week.days.filter((d) => completedDays.includes(d.day)).length;
  const allDone = doneCount === week.days.length;

  return (
    <div className="rounded-2xl bg-surface-0 shadow-soft overflow-hidden">
      {/* Week header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-2"
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
            allDone
              ? "bg-success-500/15 text-success-500"
              : "bg-brand-500/10 text-brand-500"
          }`}
        >
          {allDone ? <Check size={20} /> : `W${week.week}`}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink-900">{week.title}</p>
          <p className="text-xs text-ink-400">
            {doneCount}/{week.days.length} days done
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`text-ink-300 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Day rows */}
      {expanded && (
        <div className="border-t border-ink-100 divide-y divide-ink-100">
          {week.days.map((day) => {
            const done = completedDays.includes(day.day);
            const isCurrent = day.day === currentDay;
            const isMock = MOCK_DAYS.includes(day.day);
            const locked = plan === "free" && day.day > FREE_TIER_MAX_DAY;
            const score = dayScores[day.day];

            return (
              <button
                key={day.day}
                onClick={() => {
                  if (locked) { onUpgrade(); return; }
                  if (done || isCurrent) onStartDay(day.day);
                }}
                disabled={!done && !isCurrent && !locked}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isCurrent && !done
                    ? "bg-brand-50/60"
                    : "hover:bg-surface-2 disabled:opacity-50"
                }`}
              >
                {/* Day number / status */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? "bg-success-500/15 text-success-500"
                      : isCurrent
                        ? "bg-brand-500 text-white"
                        : locked
                          ? "bg-ink-100 text-ink-400"
                          : "bg-ink-100 text-ink-500"
                  }`}
                >
                  {done ? <Check size={14} /> : locked ? <Lock size={12} /> : day.day}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className={`truncate text-sm font-medium ${done || isCurrent ? "text-ink-900" : "text-ink-600"}`}>
                    {day.title}
                    {isMock && <span className="ml-1.5 text-xs text-amber-500">Mock</span>}
                  </p>
                  {score !== undefined && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={10} className="text-amber-500" />
                      <span className="text-xs text-ink-400">{score}/100</span>
                    </div>
                  )}
                </div>

                {/* Action */}
                {isCurrent && !done && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white shadow-popAccent">
                    <Play size={14} fill="currentColor" />
                  </div>
                )}
                {locked && (
                  <span className="text-xs font-semibold text-brand-500">Pro</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
