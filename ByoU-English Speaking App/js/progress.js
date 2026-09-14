import { supabase } from "./supabase.js";

export function dbCourseId(courseId) {
  if (courseId === "combined") return "bundle";
  return courseId || null;
}

export function uiCourseId(dbId) {
  if (!dbId) return null;
  if (dbId === "bundle") return "combined";
  return dbId;
}

function localParts(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function localISODate(date = new Date()) {
  return localParts(date);
}

export function toISODate(value) {
  if (!value) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return localParts(value);
  }
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return localParts(parsed);
}

export function practiceDatesFromProgress(rows) {
  return [...new Set(
    (rows ?? [])
      .filter((row) => row.session_completed && row.date)
      .map((row) => toISODate(row.date))
      .filter(Boolean),
  )].sort();
}

export function dayNumberFromSession(row) {
  const joined = row?.course_days;
  const n = Array.isArray(joined) ? joined[0]?.day_number : joined?.day_number;
  return Number.isFinite(n) ? n : null;
}

export function summarizeActivity(progressRows, sessionRows, today = localISODate()) {
  const rows = progressRows ?? [];
  const sessions = sessionRows ?? [];
  const fromProgress = practiceDatesFromProgress(rows);
  const fromSessions = [...new Set(
    sessions
      .filter((row) => row.completed_at)
      .map((row) => toISODate(row.completed_at))
      .filter(Boolean),
  )];
  const practiceDays = [...new Set([...fromProgress, ...fromSessions])].sort();

  const progressNums = rows
    .filter((row) => row.session_completed && row.day_unlocked >= 1 && row.day_unlocked <= 30)
    .map((row) => row.day_unlocked);
  const sessionNums = sessions
    .filter((row) => row.completed_at)
    .map(dayNumberFromSession)
    .filter((n) => n != null);
  const allNums = [...progressNums, ...sessionNums];
  const maxCompletedDay = allNums.length ? Math.max(...allNums) : 0;
  const todayDone = rows.some((row) => toISODate(row.date) === today && row.session_completed);
  const completedDays = maxCompletedDay
    ? Array.from({ length: maxCompletedDay }, (_, i) => i + 1)
    : [];
  const courseDay = maxCompletedDay
    ? (todayDone ? maxCompletedDay : Math.min(30, maxCompletedDay + 1))
    : 1;

  return { practiceDays, todayDone, maxCompletedDay, completedDays, courseDay };
}

async function loadDay1Transcript(courseId) {
  const id = dbCourseId(courseId);
  if (!id) return null;
  const { data: day, error: dayError } = await supabase
    .from("course_days")
    .select("id")
    .eq("course_id", id)
    .eq("day_number", 1)
    .maybeSingle();
  if (dayError || !day) return null;
  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("id")
    .eq("course_day_id", day.id)
    .eq("position", 1)
    .maybeSingle();
  if (questionError || !question) return null;
  const { data: answer, error: answerError } = await supabase
    .from("answers")
    .select("transcript")
    .eq("question_id", question.id)
    .not("transcript", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (answerError) return null;
  const text = (answer?.transcript ?? "").trim();
  return text || null;
}

export async function hydrateUserState() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) return { data: null, error: authError || { message: "Not signed in" } };

  const [{ data: profile, error: profileError }, { data: days, error: daysError }, { data: sessions, error: sessionsError }] = await Promise.all([
    supabase.from("profiles").select("display_name, course_id, plan, seen_tour, streak_days, total_points, last_active_date").eq("id", userId).maybeSingle(),
    supabase.from("daily_progress").select("date, session_completed, day_unlocked, points").eq("user_id", userId).order("date"),
    supabase.from("sessions").select("completed_at, course_days(day_number)").eq("user_id", userId),
  ]);

  const activity = summarizeActivity(days, sessions);

  return {
    data: {
      displayName: profile?.display_name ?? "",
      courseId: uiCourseId(profile?.course_id),
      plan: profile?.plan === "pro" ? "pro" : "free",
      seenTour: !!profile?.seen_tour,
      streakDays: profile?.streak_days ?? 0,
      totalPoints: profile?.total_points ?? 0,
      lastActiveDate: profile?.last_active_date ?? null,
      completedDays: activity.completedDays,
      practiceDays: activity.practiceDays,
      courseDay: activity.courseDay,
      todayDone: activity.todayDone,
      maxCompletedDay: activity.maxCompletedDay,
    },
    error: profileError || daysError || sessionsError || null,
  };
}

export async function updateProfile(patch) {
  const { data, error } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  if (!userId) return { data: null, error: error || { message: "Not signed in" } };
  return supabase.from("profiles").update(patch).eq("id", userId).select().maybeSingle();
}

export async function loadMyProgress(courseId) {
  const { data, error } = await hydrateUserState();
  const resolvedCourseId = courseId || data?.courseId || null;
  const day1Transcript = await loadDay1Transcript(resolvedCourseId);

  return {
    data: {
      streakDays: data?.streakDays ?? 0,
      totalPoints: data?.totalPoints ?? 0,
      completedDays: data?.completedDays ?? [],
      day1Transcript,
      courseId: data?.courseId ?? null,
      seenTour: data?.seenTour ?? false,
      plan: data?.plan || "free",
      displayName: data?.displayName ?? "",
      courseDay: data?.courseDay ?? 1,
    },
    error,
  };
}
