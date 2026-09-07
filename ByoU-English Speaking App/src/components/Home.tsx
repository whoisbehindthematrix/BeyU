import { Flame, Mic, Layers, ChevronRight, Shield, Play, BookOpen } from "lucide-react";
import { MISSIONS, APP_CONFIG } from "../config";
import type { ProgressState, UserSession } from "../lib/storage";
import { ProgressRing } from "./ProgressRing";
import { isSameWeek, daysBetween, FREE_TIER_MAX_DAY } from "../lib/storage";
import { getCourseDay, COURSES } from "../lib/curriculum";

interface HomeProps {
  user: UserSession;
  progress: ProgressState;
  onStartMission: (missionId: string) => void;
  onGoFlashcards: () => void;
  onGoRewards: () => void;
  onGoCoursePlan: () => void;
  onStartCourseDay: (day: number) => void;
  onUpgrade: () => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function Home({
  user,
  progress,
  onStartMission,
  onGoFlashcards,
  onGoRewards,
  onGoCoursePlan,
  onStartCourseDay,
  onUpgrade,
}: HomeProps) {
  const displayName = (user.name && user.name !== "You")
    ? user.name.split(" ")[0]
    : user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1);
  const firstName = displayName;
  const courseId = user.courseId;
  const course = courseId ? COURSES[courseId] : null;
  const todayLesson = courseId ? getCourseDay(courseId, progress.courseDay) : null;
  const dayDone = progress.completedDays.includes(progress.courseDay);
  const locked = user.plan === "free" && progress.courseDay > FREE_TIER_MAX_DAY;

  const weeklyDays = (() => {
    if (!isSameWeek(progress.weeklyStartDay, progress.simDateOffset)) return 0;
    const weekStart = progress.weeklyStartDay!;
    return progress.practiceDays.filter(
      (d) => daysBetween(weekStart, d) >= 0 && daysBetween(weekStart, d) < 7,
    ).length;
  })();
  const weeklyPct = Math.min(100, Math.round((weeklyDays / APP_CONFIG.weeklyGoalDays) * 100));

  const coursePct = Math.round((progress.completedDays.length / 30) * 100);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <div>
          <p className="text-sm font-medium text-ink-600">{getGreeting()},</p>
          <h1 className="text-xl font-extrabold text-ink-900">{firstName} 👋</h1>
        </div>
        <button
          onClick={onGoRewards}
          className="flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1.5"
        >
          <Flame size={16} className="text-accent-500" />
          <span className="text-sm font-bold text-accent-500">
            {progress.streak > 0 ? progress.streak : "Start"}
          </span>
        </button>
      </div>

      {/* Course progress + today's lesson hero */}
      {course && todayLesson && (
        <div className="px-5">
          {/* Course progress mini bar */}
          <button
            onClick={onGoCoursePlan}
            className="mb-3 flex w-full items-center gap-3 rounded-xl bg-surface-0 px-4 py-3 shadow-soft transition-transform active:scale-[0.98]"
          >
            <span className="text-lg">{course.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-bold text-ink-800">{course.name}</p>
              <div className="mt-1 h-1.5 rounded-full bg-ink-200">
                <div
                  className="h-1.5 rounded-full bg-brand-500 transition-all"
                  style={{ width: `${coursePct}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-bold text-brand-500">
              {coursePct > 0 ? `${coursePct}%` : "Begin"}
            </span>
            <ChevronRight size={16} className="text-ink-300" />
          </button>

          {/* Today's lesson hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-pop">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -right-4 top-12 h-20 w-20 rounded-full bg-white/5" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                {coursePct === 0 ? "Day 1 of 30 \u2014 let\u2019s begin" : `Day ${progress.courseDay} of 30`}
              </p>
              <h2 className="mt-1.5 text-lg font-bold leading-snug">
                {todayLesson.title}
              </h2>
              <p className="mt-1 text-sm text-white/70">
                {todayLesson.questions.length} questions &middot; ~5 min
              </p>
              {locked ? (
                <button
                  onClick={onUpgrade}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-600 shadow-soft transition-transform active:scale-95"
                >
                  <BookOpen size={16} />
                  Unlock with Pro
                </button>
              ) : dayDone ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold text-white">
                  Done for today ✓
                </div>
              ) : (
                <button
                  onClick={() => onStartCourseDay(progress.courseDay)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-600 shadow-soft transition-transform active:scale-95"
                >
                  <Play size={16} fill="currentColor" />
                  Start today's lesson
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fallback hero if no course yet */}
      {!course && (
        <div className="px-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-pop">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                Today's mission
              </p>
              <h2 className="mt-1.5 text-lg font-bold leading-snug">
                {MISSIONS[0].title}
              </h2>
              <p className="mt-1 text-sm text-white/70">{MISSIONS[0].subtitle}</p>
              <button
                onClick={() => onStartMission(MISSIONS[0].id)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-600 shadow-soft transition-transform active:scale-95"
              >
                <Play size={16} fill="currentColor" />
                Start now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        <button
          onClick={() => onStartMission(MISSIONS[0].id)}
          className="flex flex-col gap-2 rounded-2xl bg-surface-0 p-4 text-left shadow-soft transition-transform active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
            <Mic size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-ink-900">Free practice</p>
            <p className="text-xs text-ink-600">Answer any prompt</p>
          </div>
        </button>
        <button
          onClick={onGoFlashcards}
          className="flex flex-col gap-2 rounded-2xl bg-surface-0 p-4 text-left shadow-soft transition-transform active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/10 text-success-500">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-ink-900">Flashcards</p>
            <p className="text-xs text-ink-600">Learn new words</p>
          </div>
        </button>
      </div>

      {/* Weekly progress ring */}
      <div className="mt-5 px-5">
        <div className="flex items-center gap-4 rounded-2xl bg-surface-0 p-4 shadow-soft">
          <ProgressRing
            progress={weeklyPct}
            size={72}
            label={weeklyDays > 0 ? `${weeklyDays}/${APP_CONFIG.weeklyGoalDays}` : ""}
            sublabel={weeklyDays > 0 ? "days" : ""}
          />
          <div className="flex-1">
            <p className="text-sm font-bold text-ink-900">Weekly progress</p>
            <p className="mt-0.5 text-xs text-ink-600">
              {weeklyDays > 0
                ? `${weeklyDays} of ${APP_CONFIG.weeklyGoalDays} days this week`
                : "No sessions yet this week"}
            </p>
            <p className="mt-1 text-xs font-medium text-brand-500">
              {weeklyPct >= 100
                ? "Goal reached!"
                : weeklyDays === 0
                  ? `Practise ${APP_CONFIG.weeklyGoalDays} days to finish week 1`
                  : `${APP_CONFIG.weeklyGoalDays - weeklyDays} days to go`}
            </p>
          </div>
        </div>
      </div>

      {/* More missions */}
      <div className="mt-6 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink-900">More to explore</h3>
          {course && (
            <button onClick={onGoCoursePlan} className="text-xs font-medium text-brand-500">
              Course plan
            </button>
          )}
        </div>
        <div className="space-y-2.5">
          {MISSIONS.slice(1).map((m) => (
            <button
              key={m.id}
              onClick={() => m.type === "flashcard" ? onGoFlashcards() : onStartMission(m.id)}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface-0 p-3.5 text-left shadow-soft transition-transform active:scale-[0.98]"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  m.type === "flashcard"
                    ? "bg-success-500/10 text-success-500"
                    : m.difficulty === "hard"
                      ? "bg-accent-500/10 text-accent-500"
                      : "bg-amber-500/10 text-amber-500"
                }`}
              >
                {m.type === "flashcard" ? (
                  <Layers size={18} />
                ) : (
                  <Mic size={18} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-ink-900">
                  {m.title}
                </p>
                <p className="text-xs text-ink-600">{m.subtitle}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-500">
                  +{m.points}
                </span>
                <ChevronRight size={16} className="text-ink-300" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Privacy footer */}
      <div className="mt-6 px-5">
        <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3">
          <Shield size={16} className="shrink-0 text-success-500" />
          <p className="text-xs leading-relaxed text-ink-600">
            🔒 Private. Nobody else can hear you.
          </p>
        </div>
      </div>
    </div>
  );
}
