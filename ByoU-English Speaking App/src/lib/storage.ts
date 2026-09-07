export type CourseId = "interview" | "conversation" | "combined";
export type PlanTier = "free" | "pro";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  goal: string;
  createdAt: number;
  courseId: CourseId | null;
  plan: PlanTier;
}

export interface ProgressState {
  streak: number;
  lastPracticeDate: string | null;
  points: number;
  missionsCompleted: number;
  flashcardsLearned: number;
  weeklyMinutes: number;
  weeklyStartDay: string | null;
  practiceDays: string[];
  seenTour: boolean;
  moodHistory: { date: string; mood: string }[];
  lastMissionId: string | null;
  courseDay: number;
  completedDays: number[];
  dayScores: Record<number, number>;
  simDateOffset: number;
}

export interface AuthState {
  user: UserSession | null;
  rememberMe: boolean;
}

const STORAGE_KEYS = {
  auth: "byou_auth",
  progress: "byou_progress",
  prefs: "byou_prefs",
} as const;

export const defaultProgress: ProgressState = {
  streak: 0,
  lastPracticeDate: null,
  points: 0,
  missionsCompleted: 0,
  flashcardsLearned: 0,
  weeklyMinutes: 0,
  weeklyStartDay: null,
  practiceDays: [],
  seenTour: false,
  moodHistory: [],
  lastMissionId: null,
  courseDay: 1,
  completedDays: [],
  dayScores: {},
  simDateOffset: 0,
};

export function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.auth);
    if (!raw) return { user: null, rememberMe: false };
    const parsed = JSON.parse(raw);
    if (parsed.user && !parsed.user.plan) parsed.user.plan = "free";
    if (parsed.user && parsed.user.courseId === undefined) parsed.user.courseId = null;
    return parsed;
  } catch {
    return { user: null, rememberMe: false };
  }
}

export function saveAuth(state: AuthState): void {
  localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(state));
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.auth);
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.progress);
    if (!raw) return { ...defaultProgress };
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return { ...defaultProgress };
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(state));
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEYS.progress);
}

export function todayStr(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function updateStreakOnPractice(progress: ProgressState): ProgressState {
  const today = todayStr(progress.simDateOffset);
  if (progress.lastPracticeDate === today) {
    return progress;
  }
  let newStreak = 1;
  if (progress.lastPracticeDate) {
    const gap = daysBetween(progress.lastPracticeDate, today);
    if (gap === 1) newStreak = progress.streak + 1;
    else if (gap === 0) newStreak = progress.streak;
    else newStreak = 1;
  }
  const practiceDays = progress.practiceDays.includes(today)
    ? progress.practiceDays
    : [...progress.practiceDays, today];
  return {
    ...progress,
    streak: newStreak,
    lastPracticeDate: today,
    practiceDays,
  };
}

export function isSameWeek(weeklyStartDay: string | null, offset = 0): boolean {
  if (!weeklyStartDay) return false;
  return daysBetween(weeklyStartDay, todayStr(offset)) < 7;
}

export const FREE_TIER_MAX_DAY = 7;
