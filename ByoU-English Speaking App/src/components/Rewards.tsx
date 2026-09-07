import { useState } from "react";
import { Flame, Star, MessageSquare, BookOpen, Calendar, Trophy, Crown, ChevronRight, ChevronDown } from "lucide-react";
import { CountUp } from "./CountUp";
import { BADGES, LEADERBOARD } from "../config";
import type { ProgressState } from "../lib/storage";

const badgeIcons: Record<string, typeof Flame> = {
  message: MessageSquare,
  flame: Flame,
  book: BookOpen,
  star: Star,
  calendar: Calendar,
};

interface RewardsProps {
  progress: ProgressState;
}

export function Rewards({ progress }: RewardsProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);

  const monthDays = (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const practicedSet = new Set(progress.practiceDays);
    const result: { date: string; day: number; practiced: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      result.push({ date: dateStr, day: d, practiced: practicedSet.has(dateStr) });
    }
    return result;
  })();
  const earnedBadges = BADGES.filter((b) => {
    const val = progress[b.field];
    return val >= b.threshold;
  });

  const sortedLeaderboard = [...LEADERBOARD].sort((a, b) => b.points - a.points);
  const youEntry = sortedLeaderboard.find((e) => "isYou" in e && e.isYou);
  if (youEntry) youEntry.points = progress.points;
  sortedLeaderboard.sort((a, b) => b.points - a.points);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-xl font-extrabold text-ink-900">Rewards</h1>
      </div>

      {/* Points hero */}
      <div className="px-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 p-6 text-white shadow-popAccent">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Total points
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">
                <CountUp to={progress.points} />
              </span>
              <Star size={20} className="text-white/80" fill="currentColor" />
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Flame size={16} className="text-white/90" />
                <span className="text-sm font-bold">{progress.streak} day streak</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy size={16} className="text-white/90" />
                <span className="text-sm font-bold">{earnedBadges.length} badges</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streak calendar */}
      <div className="mt-5 px-5">
        <h3 className="mb-2 text-sm font-bold text-ink-900">Streak calendar</h3>
        <div className="rounded-2xl bg-surface-0 p-4 shadow-soft">
          <div className="grid grid-cols-7 gap-1.5">
            {monthDays.map((d) => (
              <div
                key={d.date}
                className={`flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  d.practiced
                    ? "bg-accent-500 text-white"
                    : "bg-surface-2 text-ink-300"
                }`}
              >
                {d.day}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex h-4 w-4 items-center justify-center rounded bg-accent-500" />
            <span className="text-xs text-ink-600">Days you practised</span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-5 px-5">
        <h3 className="mb-2 text-sm font-bold text-ink-900">Badges</h3>
        {(() => {
          const hasAnyBadge = earnedBadges.length > 0;
          const nextBadge = BADGES.find((b) => progress[b.field] < b.threshold);
          const visibleBadges = showAllBadges || hasAnyBadge ? BADGES : (nextBadge ? [nextBadge] : BADGES.slice(0, 1));
          const NextIcon = nextBadge ? (badgeIcons[nextBadge.icon] ?? Star) : Star;
          const remaining = nextBadge ? nextBadge.threshold - progress[nextBadge.field] : 0;

          return (
            <>
              {/* Next badge prompt when no badges earned */}
              {!hasAnyBadge && nextBadge && !showAllBadges && (
                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-brand-50/60 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                    <NextIcon size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink-900">{nextBadge.name}</p>
                    <p className="text-xs text-ink-600">
                      {remaining} {remaining === 1 ? "mission" : "more"} away
                    </p>
                  </div>
                </div>
              )}

              {/* Badge grid */}
              {(hasAnyBadge || showAllBadges) && (
                <div className="grid grid-cols-3 gap-3">
                  {visibleBadges.map((badge) => {
                    const Icon = badgeIcons[badge.icon] ?? Star;
                    const earned = progress[badge.field] >= badge.threshold;
                    return (
                      <div
                        key={badge.id}
                        className={`flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-all ${
                          earned
                            ? "bg-surface-0 shadow-soft"
                            : "bg-surface-2 opacity-60"
                        }`}
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full ${
                            earned
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-ink-100 text-ink-300"
                          }`}
                        >
                          <Icon size={22} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold leading-tight text-ink-900">
                            {badge.name}
                          </p>
                          <p className="mt-0.5 text-[10px] leading-tight text-ink-600">
                            {badge.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* See all badges toggle */}
              {!hasAnyBadge && !showAllBadges && (
                <button
                  onClick={() => setShowAllBadges(true)}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-0 py-2.5 text-xs font-medium text-ink-500 shadow-soft hover:bg-surface-2"
                >
                  See all badges
                  <ChevronDown size={14} />
                </button>
              )}
            </>
          );
        })()}
      </div>

      {/* Leaderboard toggle */}
      <div className="mt-5 px-5">
        <button
          onClick={() => setShowLeaderboard((s) => !s)}
          className="flex w-full items-center justify-between rounded-2xl bg-surface-0 p-4 shadow-soft"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
              <Crown size={20} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-ink-900">Leaderboard</p>
              <p className="text-xs text-ink-600">
                {showLeaderboard ? "Tap to hide" : "See how you rank"}
              </p>
            </div>
          </div>
          <ChevronRight
            size={20}
            className={`text-ink-300 transition-transform ${showLeaderboard ? "rotate-90" : ""}`}
          />
        </button>

        {showLeaderboard && (
          <div className="mt-2.5 space-y-2 rounded-2xl bg-surface-0 p-4 shadow-soft animate-slide-up">
            <p className="mb-2 text-xs font-medium text-ink-600">
              Ranked by practice days — never by speaking level.
            </p>
            {sortedLeaderboard.map((entry, i) => {
              const isYou = "isYou" in entry && entry.isYou;
              return (
                <div
                  key={entry.name}
                  className={`flex items-center gap-3 rounded-xl p-2.5 ${
                    isYou ? "bg-brand-50" : ""
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-amber-500/15 text-amber-600"
                        : i === 1
                          ? "bg-ink-200 text-ink-600"
                          : i === 2
                            ? "bg-accent-500/15 text-accent-600"
                            : "bg-surface-2 text-ink-400"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      isYou ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-600"
                    }`}
                  >
                    {entry.avatar}
                  </div>
                  <span
                    className={`flex-1 text-sm font-bold ${
                      isYou ? "text-brand-600" : "text-ink-800"
                    }`}
                  >
                    {entry.name}
                  </span>
                  <span className="text-sm font-bold text-ink-600">
                    {entry.points}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
