import { useState } from "react";
import { Settings, LogOut, Trash2, ChevronRight, TrendingUp, Mic, BookOpen, Flame, Crown, Calendar, FastForward } from "lucide-react";
import { Sheet } from "./Sheet";
import { Button } from "./Button";
import { SETTINGS_OPTIONS } from "../config";
import type { ProgressState, UserSession, CourseId } from "../lib/storage";
import { COURSES } from "../lib/curriculum";
import { APP_CONFIG } from "../config";

interface ProfileProps {
  user: UserSession;
  progress: ProgressState;
  onUpdateGoal: (goal: string) => void;
  onUpdateName: (name: string) => void;
  onDeleteRecordings: () => void;
  onLogout: () => void;
  onChangeCourse: () => void;
  onManagePlan: () => void;
  onAdvanceDay: () => void;
}

export function Profile({
  user,
  progress,
  onUpdateGoal,
  onUpdateName,
  onDeleteRecordings,
  onLogout,
  onChangeCourse,
  onManagePlan,
  onAdvanceDay,
}: ProfileProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(user.goal || "");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const displayName = (user.name && user.name !== "You")
    ? user.name
    : user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1);

  const stats = [
    { label: "Day streak", value: progress.streak, icon: Flame, color: "text-accent-500 bg-accent-500/10" },
    { label: "Points", value: progress.points, icon: TrendingUp, color: "text-amber-500 bg-amber-500/10" },
    { label: "Missions", value: progress.missionsCompleted, icon: Mic, color: "text-brand-500 bg-brand-500/10" },
    { label: "Words learned", value: progress.flashcardsLearned, icon: BookOpen, color: "text-success-500 bg-success-500/10" },
  ];

  const course = user.courseId ? COURSES[user.courseId] : null;
  const goalOptions: { id: CourseId; label: string }[] = [
    { id: "interview", label: "Interview Preparation" },
    { id: "conversation", label: "General Conversation" },
    { id: "combined", label: "Interview + Conversation" },
  ];

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <h1 className="text-xl font-extrabold text-ink-900">Profile</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="tap-target rounded-lg p-2 text-ink-400 hover:bg-surface-2"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center px-5 pt-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-extrabold text-white shadow-pop">
          {displayName.charAt(0).toUpperCase()}
        </div>
        {editingName ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="rounded-lg border border-brand-300 px-3 py-1.5 text-center text-base font-bold text-ink-900 outline-none focus:ring-4 focus:ring-brand-50"
            />
            <button
              onClick={() => {
                if (nameInput.trim()) {
                  onUpdateName(nameInput.trim());
                  setEditingName(false);
                }
              }}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-bold text-white"
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setNameInput(user.name);
              setEditingName(true);
            }}
            className="mt-3 text-lg font-bold text-ink-900"
          >
            {displayName}
          </button>
        )}
        <p className="text-sm text-ink-400">{user.email}</p>

        {/* Plan + level badges */}
        <div className="mt-2 flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            user.plan === "pro"
              ? "bg-accent-500/15 text-accent-500"
              : "bg-ink-100 text-ink-500"
          }`}>
            {user.plan === "pro" ? "Pro" : "Free"}
          </span>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-500">
            Building confidence
          </span>
        </div>

        {/* Course chip */}
        {course && (
          <button
            onClick={onChangeCourse}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1.5 text-sm font-medium text-brand-500"
          >
            <span>{course.emoji}</span>
            {course.name}
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Course day progress */}
      {user.courseId && (
        <div className="mt-5 px-5">
          <div className="flex items-center gap-3 rounded-2xl bg-surface-0 p-4 shadow-soft">
            <Calendar size={20} className="text-brand-500" />
            <div className="flex-1">
              <p className="text-sm font-bold text-ink-900">
                Day {progress.courseDay} of 30
              </p>
              <p className="text-xs text-ink-400">
                {progress.completedDays.length} days completed
              </p>
            </div>
            <div className="h-1.5 w-20 rounded-full bg-ink-200">
              <div
                className="h-1.5 rounded-full bg-brand-500 transition-all"
                style={{ width: `${Math.round((progress.completedDays.length / 30) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* How far you've come */}
      <div className="mt-5 px-5">
        <h3 className="mb-2 text-sm font-bold text-ink-900">How far you've come</h3>
        {stats.every((s) => s.value === 0) ? (
          <div className="flex items-center gap-3 rounded-2xl bg-surface-0 p-4 shadow-soft">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
              <Mic size={20} />
            </div>
            <p className="text-sm text-ink-500">
              Finish your first mission to start tracking progress
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 rounded-2xl bg-surface-0 p-4 shadow-soft"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-ink-900">{stat.value}</p>
                    <p className="text-xs text-ink-400">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 px-5 space-y-2.5">
        {/* Manage plan */}
        <button
          onClick={onManagePlan}
          className="flex w-full items-center gap-3 rounded-2xl bg-surface-0 p-4 text-left shadow-soft transition-transform active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
            <Crown size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink-900">
              {user.plan === "pro" ? "Manage plan" : "Upgrade to Pro"}
            </p>
            <p className="text-xs text-ink-400">
              {user.plan === "pro" ? "You're on the Pro plan" : "Unlock the full 30-day course"}
            </p>
          </div>
          <ChevronRight size={18} className="text-ink-300" />
        </button>

        {/* My data */}
        <button
          onClick={() => setShowDelete(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-surface-0 p-4 text-left shadow-soft"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
            <Trash2 size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink-900">My data</p>
            <p className="text-xs text-ink-400">Delete my recordings</p>
          </div>
          <ChevronRight size={18} className="text-ink-300" />
        </button>

        {/* Log out */}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-2xl bg-surface-0 p-4 text-left shadow-soft"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">
            <LogOut size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink-900">Log out</p>
            <p className="text-xs text-ink-400">You can come back anytime</p>
          </div>
        </button>
      </div>

      {/* Dev tools */}
      {APP_CONFIG.DEMO_MODE && (
        <div className="mt-5 px-5">
          <div className="rounded-2xl border-2 border-dashed border-ink-200 bg-surface-2/50 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
              Demo tools
            </p>
            <button
              onClick={onAdvanceDay}
              className="flex w-full items-center gap-3 rounded-xl bg-surface-0 p-3 text-left shadow-soft transition-transform active:scale-95"
            >
              <FastForward size={18} className="text-brand-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-ink-900">Skip to next day</p>
                <p className="text-xs text-ink-400">
                  Currently: Day {progress.courseDay} &middot; Offset: +{progress.simDateOffset}d
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-ink-300">
        Byo<span className="text-accent-500 font-bold">U</span> v0.2 &middot; Prototype
      </p>

      {/* Settings sheet */}
      <Sheet open={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <div className="space-y-3">
          {SETTINGS_OPTIONS.map((opt) => (
            <div key={opt.id} className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-ink-800">{opt.label}</span>
              {opt.type === "toggle" ? (
                <button
                  onClick={() => setNotifEnabled((v) => !v)}
                  className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${
                    notifEnabled ? "bg-brand-500" : "bg-ink-200"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white shadow-soft transition-transform ${
                      notifEnabled ? "translate-x-4" : ""
                    }`}
                  />
                </button>
              ) : (
                <ChevronRight size={18} className="text-ink-300" />
              )}
            </div>
          ))}
        </div>
      </Sheet>

      {/* Goal selection sheet */}
      <Sheet open={showGoals} onClose={() => setShowGoals(false)} title="Change course">
        <div className="space-y-2">
          {goalOptions.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setSelectedGoal(g.id);
                onUpdateGoal(g.id);
                setShowGoals(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl p-3.5 text-left text-sm font-medium transition-all ${
                selectedGoal === g.id
                  ? "bg-brand-500/10 text-brand-600 ring-2 ring-brand-300"
                  : "bg-surface-1 text-ink-700 hover:bg-surface-2"
              }`}
            >
              {g.label}
              {selectedGoal === g.id && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Delete confirmation sheet */}
      <Sheet open={showDelete} onClose={() => { setShowDelete(false); setDeleteConfirmed(false); }} title="Delete recordings?">
        <p className="text-sm leading-relaxed text-ink-500">
          This will permanently remove all voice recordings stored on this device. Your text transcripts and progress will remain.
        </p>
        {deleteConfirmed ? (
          <p className="mt-4 text-sm font-bold text-success-600">
            Done! All recordings have been deleted.
          </p>
        ) : null}
        <div className="mt-6 space-y-2.5">
          {!deleteConfirmed ? (
            <>
              <Button
                full
                variant="danger"
                onClick={() => {
                  onDeleteRecordings();
                  setDeleteConfirmed(true);
                }}
              >
                Yes, delete recordings
              </Button>
              <Button full variant="ghost" onClick={() => setShowDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button full onClick={() => { setShowDelete(false); setDeleteConfirmed(false); }}>
              Done
            </Button>
          )}
        </div>
      </Sheet>
    </div>
  );
}
