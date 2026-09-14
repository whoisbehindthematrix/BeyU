import { supabase } from "./supabase.js";
import { summarizeActivity, uiCourseId } from "./progress.js";

export async function loadBootState() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) console.error(sessionError);
  const session = sessionData?.session ?? null;
  if (!session?.user) {
    return { session: null, profile: null, todayDone: false, maxDay: 0, maxCompletedDay: 0, courseId: null, practiceDays: [], completedDays: [] };
  }

  const userId = session.user.id;
  const [profileRes, progressRes, sessionsRes] = await Promise.all([
    supabase.from("profiles").select("display_name, course_id, streak_days, total_points, last_active_date, level").eq("id", userId).maybeSingle(),
    supabase.from("daily_progress").select("date, session_completed, day_unlocked, points").eq("user_id", userId),
    supabase.from("sessions").select("completed_at, course_days(day_number)").eq("user_id", userId),
  ]);
  if (profileRes.error) console.error(profileRes.error);
  if (progressRes.error) console.error(progressRes.error);
  if (sessionsRes.error) console.error(sessionsRes.error);

  const profile = profileRes.data ?? null;
  const activity = summarizeActivity(progressRes.data, sessionsRes.data);

  return {
    session,
    profile,
    todayDone: activity.todayDone,
    maxDay: activity.maxCompletedDay,
    maxCompletedDay: activity.maxCompletedDay,
    courseId: uiCourseId(profile?.course_id),
    practiceDays: activity.practiceDays,
    completedDays: activity.completedDays,
    courseDay: activity.courseDay,
  };
}

function authRedirectTo() {
  const url = new URL(window.location.href);
  let path = url.pathname;
  if (path.endsWith("index.html")) path = path.slice(0, -"index.html".length);
  if (!path.endsWith("/")) path += "/";
  return `${url.origin}${path}`;
}

export async function signInWithGoogle() {
  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: authRedirectTo() },
  });
}

export async function signInWithEmail(email) {
  return await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: authRedirectTo() },
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getUser() {
  return await supabase.auth.getUser();
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
