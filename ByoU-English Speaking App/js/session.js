import { supabase } from "./supabase.js";
import { getUser, signOut } from "./auth.js";
import { setSession, track } from "./track.js";
import { hydrateUserState, updateProfile, uiCourseId } from "./progress.js";
import { interviewWeeks, conversationWeeks, combinedWeeks } from "./curriculum.js";

let stopTimer = () => {};
let route = () => {};
let renderPractice = () => {};
let spawnConfetti = () => {};
let showToast = () => {};
let showDailyDigest = () => {};
let $ = (id) => document.getElementById(id);

const MOOD_CONFIDENCE = { nervous: 2, okay: 3, good: 4, great: 5 };

async function requireUser() {
  const { data, error } = await getUser();
  if (error) throw error;
  const user = data?.user;
  if (!user?.id) throw new Error("Not signed in");
  return user;
}

function dbCourseId(courseId) {
  if (courseId === "combined") return "bundle";
  return courseId;
}

function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isLocalTestHost() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function localTodayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return localISODate(d);
}

export function mondayOfWeek(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return localISODate(d);
}

export function weekPracticeCount(practiceDays, offset = 0) {
  const weekStart = mondayOfWeek(offset);
  const today = localTodayStr(offset);
  const days = new Set();
  for (const raw of practiceDays || []) {
    const d = String(raw).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d >= weekStart && d <= today) days.add(d);
  }
  return days.size;
}

export function resetFlashIfNewDay() {
  const today = localTodayStr();
  if (store.flash.dealtOn === today) return false;
  store.flash.dealtOn = today;
  store.flash.shownIds = [];
  store.flash.retry = [];
  store.flash.done = false;
  store.flash.cards = null;
  store.flash.idx = 0;
  store.flash.flipped = false;
  store.flash.learned = 0;
  store.flash.exitDir = null;
  store.flash.drill = "idle";
  store.flash.loadError = null;
  store.flash.nudge = false;
  store.flash.spokenCount = 0;
  return true;
}

export async function refreshProgressFromDb() {
  const { data, error } = await hydrateUserState();
  if (error) console.error(error);
  applyHydratedProgress(data);
  return data;
}

function moodToConfidence(mood) {
  if (mood == null || mood === "") return null;
  return MOOD_CONFIDENCE[mood] ?? null;
}

const SAFE_FEEDBACK = {
  praise: "You spoke — that is the hardest part.",
  one_upgrade: "Next time, add one more sentence about why.",
  resay_sentence: "I am ready to practise and improve every day.",
  could_have_said: "I am ready to practise and speak a little more clearly every day.",
  used_target_words: [],
  confidence_score: 3,
  prompt_version: "v1",
};

function toAiFeedback(payload) {
  return {
    praise: payload?.praise ?? "",
    one_upgrade: payload?.one_upgrade ?? "",
    resay_sentence: payload?.resay_sentence ?? "",
    could_have_said: payload?.could_have_said || payload?.resay_sentence || "",
    used_target_words: payload?.used_target_words ?? [],
    confidence_score: payload?.confidence_score ?? null,
    prompt_version: payload?.prompt_version ?? "v1",
  };
}

function toFeedbackChunks(payload) {
  const rewrite = payload.could_have_said || payload.resay_sentence || "";
  return [
    { id: "worked", icon: "worked", title: "What worked", body: payload.praise, tone: "positive" },
    { id: "upgrade", icon: "upgrade", title: "One upgrade", body: payload.one_upgrade, tone: "tip", better: payload.resay_sentence },
    { id: "rewrite", icon: "rewrite", title: "You could have said", body: rewrite, tone: "rewrite" },
    { id: "drill", icon: "drill", title: "Say it once more", body: payload.resay_sentence, tone: "drill" },
  ];
}

function isFeedbackPayload(data) {
  return data && typeof data === "object"
    && typeof data.praise === "string"
    && typeof data.one_upgrade === "string"
    && typeof data.resay_sentence === "string";
}

async function fetchFeedbackContext(questionId) {
  let level = "";
  let target_words = [];
  let recent_upgrades = [];
  try {
    const user = await requireUser();
    const [profileRes, questionRes, answersRes] = await Promise.all([
      supabase.from("profiles").select("level").eq("id", user.id).maybeSingle(),
      questionId
        ? supabase.from("questions").select("target_words").eq("id", questionId).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("answers")
        .select("ai_feedback")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);
    level = profileRes.data?.level ?? "";
    target_words = questionRes.data?.target_words ?? [];
    recent_upgrades = (answersRes.data ?? [])
      .map((row) => row.ai_feedback?.one_upgrade)
      .filter((tip) => typeof tip === "string" && tip.trim());
  } catch {
    /* grounding is best-effort; invoke still runs with defaults */
  }
  return { level, target_words, recent_upgrades };
}

const DEFAULT_HINT = "Take your time. Start with 'I would say...' and build from there.";

function clipResayFromHint(hint) {
  const words = String(hint || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 8 && words.length <= 14) return words.join(" ");
  if (words.length > 14) return words.slice(0, 14).join(" ");
  const pad = "Start with I would say then add one detail.".split(/\s+/);
  return [...words, ...pad].slice(0, 8).join(" ");
}

function hintFeedback(hint) {
  const text = String(hint || "").trim() || DEFAULT_HINT;
  return {
    praise: "You opened the mic — that already counts.",
    one_upgrade: text,
    could_have_said: text,
    resay_sentence: clipResayFromHint(text),
    used_target_words: [],
    confidence_score: 2,
    prompt_version: "v5",
  };
}

async function requestAiFeedback(transcript, inputMode, extra = {}) {
  const questions = practiceQuestions();
  const prompt = questions[store.practice.promptIdx % questions.length];
  const questionId = store.practice.questionIds[store.practice.promptIdx] ?? null;
  const hint = prompt?.hint || DEFAULT_HINT;
  const input_mode = inputMode === "typed" ? "typed" : "spoken";
  const emptySpoken = input_mode === "spoken" && !String(transcript || "").trim();
  if (emptySpoken && extra.silenceTimeout) {
    store.practice.showHint = true;
    return hintFeedback(hint);
  }
  if (emptySpoken) {
    return SAFE_FEEDBACK;
  }
  try {
    const { level, target_words, recent_upgrades } = await fetchFeedbackContext(questionId);
    const question = prompt?.text ?? "";
    const body = {
      transcript,
      question,
      hint,
      level,
      target_words: input_mode === "typed" ? [] : target_words,
      recent_upgrades,
      input_mode,
      silence_timeout: !!extra.silenceTimeout,
    };
    console.log("FEEDBACK PAYLOAD:", JSON.stringify({ transcript, question, level, target_words: body.target_words, input_mode }));
    const { data, error } = await supabase.functions.invoke("feedback", { body });
    console.log("feedback invoke result", { data, error });
    if (error || !isFeedbackPayload(data)) throw error || new Error("empty feedback");
    return data;
  } catch (err) {
    console.error("requestAiFeedback failed", err);
    return SAFE_FEEDBACK;
  }
}

export async function startSession(courseDayId, confidenceBefore) {
  const user = await requireUser();
  const { data, error } = await supabase.from("sessions")
    .insert({
      user_id: user.id,
      course_day_id: courseDayId,
      confidence_before: confidenceBefore,
      device_info: { ua: navigator.userAgent },
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveAnswer({ sessionId, questionId, transcript, aiFeedback, sttEngine, durationSec }) {
  const user = await requireUser();
  return supabase.from("answers").insert({
    session_id: sessionId,
    user_id: user.id,
    question_id: questionId,
    transcript,
    ai_feedback: aiFeedback,
    stt_engine: sttEngine,
    duration_sec: durationSec,
  });
}

function localDayBounds(isoDate = localISODate()) {
  const start = new Date(`${isoDate}T00:00:00`);
  const end = new Date(`${isoDate}T23:59:59.999`);
  return { start: start.toISOString(), end: end.toISOString() };
}

const SAFE_UPGRADE = "Next time, add one more sentence about why.";

export async function getDailyDigestData() {
  const user = await requireUser();
  const today = localISODate();
  const { start, end } = localDayBounds(today);

  const [answersRes, progressRes, wordsRes, profileRes] = await Promise.all([
    supabase.from("answers")
      .select("transcript, ai_feedback, created_at")
      .eq("user_id", user.id)
      .gte("created_at", start)
      .lte("created_at", end),
    supabase.from("daily_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),
    supabase.from("user_words")
      .select("word_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("last_spoken_at", start)
      .lte("last_spoken_at", end),
    supabase.from("profiles")
      .select("display_name, streak_days")
      .eq("id", user.id)
      .maybeSingle(),
  ]);
  if (answersRes.error) throw answersRes.error;
  if (progressRes.error) throw progressRes.error;
  if (wordsRes.error) throw wordsRes.error;
  if (profileRes.error) throw profileRes.error;

  if (progressRes.data?.digest_shown) return { alreadyShown: true };

  const answers = answersRes.data ?? [];
  let best = null;
  for (const row of answers) {
    const score = Number(row.ai_feedback?.confidence_score) || 0;
    if (!best || score > best.score) {
      best = {
        score,
        transcript: (row.transcript || "").trim(),
        upgrade: row.ai_feedback?.one_upgrade || "",
      };
    }
  }

  const rawName = profileRes.data?.display_name || store.auth.user?.name || "there";
  const firstName = String(rawName).split(" ")[0] || "there";
  const streak = Number(profileRes.data?.streak_days) || store.progress.streak || 0;
  const week = Math.max(1, Math.ceil(Math.max(streak, 1) / 7));
  const filled = streak === 0 ? 0 : (streak % 7 === 0 ? 7 : streak % 7);
  const remaining = Math.max(0, 7 - filled);
  const upgrade = best?.upgrade?.trim() || "";
  const isSafeUpgrade = !upgrade || upgrade === SAFE_UPGRADE;

  return {
    alreadyShown: false,
    dayNumber: progressRes.data?.day_unlocked || store.practice.dayNum || store.progress.courseDay || 1,
    firstName,
    questionsAnswered: answers.length,
    wordsLearned: wordsRes.count ?? 0,
    points: progressRes.data?.points ?? 0,
    bestMoment: best && best.score >= 3 && best.transcript ? best.transcript : null,
    upgrade: isSafeUpgrade ? null : upgrade,
    streak,
    week,
    filled,
    remaining,
    weekCaption: remaining === 0
      ? `Week ${week} complete`
      : `${remaining} more days to finish Week ${week}`,
    weekInProgress: streak >= 8 && remaining > 0 ? `Week ${week} in progress` : null,
  };
}

export async function markDigestShown() {
  const user = await requireUser();
  const { error } = await supabase.from("daily_progress")
    .update({ digest_shown: true })
    .eq("user_id", user.id)
    .eq("date", localISODate());
  if (error) console.error(error);
}

export async function loadSavedFeedback() {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("answers")
    .select("id, created_at, transcript, ai_feedback, questions(prompt)")
    .eq("user_id", user.id)
    .not("ai_feedback", "is", null)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) return { data: [], error };
  const rows = (data ?? []).filter((row) => {
    const fb = row.ai_feedback || {};
    return fb.praise || fb.one_upgrade || fb.could_have_said;
  });
  return { data: rows, error: null };
}

export async function completeSession(sessionId, confidenceAfter, points, dayUnlocked) {
  const user = await requireUser();
  const today = localISODate();
  const { error: sessionError } = await supabase
    .from("sessions")
    .update({ completed_at: new Date().toISOString(), confidence_after: confidenceAfter })
    .eq("id", sessionId);
  if (sessionError) throw sessionError;
  const { error: progressError } = await supabase.from("daily_progress").upsert(
    { user_id: user.id, date: today, session_completed: true, points, day_unlocked: dayUnlocked ?? null },
    { onConflict: "user_id,date" },
  );
  if (progressError) throw progressError;
  const { error: rpcError } = await supabase.rpc("bump_streak");
  if (rpcError) throw rpcError;

  const [{ data: progressRow }, { data: profileRow }] = await Promise.all([
    supabase.from("daily_progress").select("*").eq("user_id", user.id).eq("date", today).maybeSingle(),
    supabase.from("profiles").select("id, display_name, streak_days, total_points, last_active_date, course_id").eq("id", user.id).maybeSingle(),
  ]);
  console.log("completeSession wrote", {
    sessionId,
    points,
    dayUnlocked,
    daily_progress: progressRow,
    profiles: profileRow,
  });
  return await getDailyDigestData();
}

export async function advanceDayForTest() {
  if (!isLocalTestHost()) return;
  const current = Math.min(30, Math.max(1, store.progress.courseDay || 1));
  const user = await requireUser();
  const { error } = await supabase.from("daily_progress").upsert(
    {
      user_id: user.id,
      date: localISODate(),
      session_completed: true,
      day_unlocked: current,
    },
    { onConflict: "user_id,date" },
  );
  if (error) throw error;
  const today = localISODate();
  const practiceDays = store.progress.practiceDays.includes(today)
    ? store.progress.practiceDays
    : [...store.progress.practiceDays, today];
  const completedDays = store.progress.completedDays.includes(current)
    ? store.progress.completedDays
    : [...store.progress.completedDays, current];
  store.progress = {
    ...store.progress,
    completedDays,
    practiceDays,
    weeklyStartDay: store.progress.weeklyStartDay || mondayOfWeek(store.progress.simDateOffset),
    courseDay: Math.min(30, current + 1),
  };
}

function currentCourseDay(override = null) {
  const n = Number(override);
  if (Number.isFinite(n) && n >= 1) return Math.min(30, n);
  const fromStore = Number(store.progress?.courseDay);
  if (Number.isFinite(fromStore) && fromStore >= 1) return Math.min(30, fromStore);
  return 1;
}

function lessonQuestionsForDay(dayNum) {
  const courseId = store.auth.user?.courseId;
  if (!courseId || !dayNum) return null;
  const lesson = getCourseDay(courseId, dayNum);
  if (!lesson?.questions?.length) return null;
  return lesson.questions;
}

function questionSig(qs) {
  return (qs || []).map((q) => (typeof q === "string" ? q : (q.text || q.prompt || ""))).join("\n");
}

function applyQuestionsForDay(dayNum, rows) {
  const before = questionSig(store.practice.courseQuestions);
  const lesson = lessonQuestionsForDay(dayNum);
  if (lesson?.length) {
    store.practice.courseQuestions = lesson;
    store.practice.questionIds = (rows ?? []).map((row) => row.id);
    return questionSig(lesson) !== before;
  }
  if (rows?.length) {
    store.practice.questionIds = rows.map((row) => row.id);
    store.practice.courseQuestions = rows.map((row) => ({
      id: row.id,
      text: row.prompt,
      hint: row.hint || "",
    }));
    return questionSig(store.practice.courseQuestions) !== before;
  }
  store.practice.questionIds = [];
  store.practice.courseQuestions = PROMPTS.map((p) => ({
    id: p.id,
    text: p.text,
    hint: p.hint || "",
  }));
  return questionSig(store.practice.courseQuestions) !== before;
}

async function lookupCourseDayId(courseId, dayNumber) {
  if (!courseId || !dayNumber) return null;
  const { data, error } = await supabase
    .from("course_days")
    .select("id")
    .eq("course_id", dbCourseId(courseId))
    .eq("day_number", dayNumber)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function lookupQuestions(courseDayId) {
  if (!courseDayId) return [];
  const { data, error } = await supabase
    .from("questions")
    .select("id, position, prompt, hint")
    .eq("course_day_id", courseDayId)
    .order("position");
  if (error) throw error;
  return data ?? [];
}

async function persistSessionStart(courseDay) {
  const { data } = await getUser();
  if (!data?.user) {
    applyQuestionsForDay(currentCourseDay(courseDay), []);
    return null;
  }
  const courseId = store.auth.user?.courseId ?? null;
  const dayNum = currentCourseDay(courseDay);
  let courseDayId = null;
  let rows = [];
  try {
    courseDayId = await lookupCourseDayId(courseId, dayNum);
    rows = await lookupQuestions(courseDayId);
  } catch (err) {
    console.error(err);
  }
  applyQuestionsForDay(dayNum, rows);
  try {
    const session = await startSession(courseDayId, null);
    store.practice.sessionId = session.id;
    setSession(session.id);
    return session;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function persistAnswer(transcript) {
  const session = await store.practice.sessionPromise;
  if (!session?.id) return;
  const questionId = store.practice.questionIds[store.practice.promptIdx] ?? null;
  const { error } = await saveAnswer({
    sessionId: session.id,
    questionId,
    transcript,
    aiFeedback: toAiFeedback(store.practice.aiFeedback),
    sttEngine: store.practice.sttEngine || (store.practice.typingMode ? "typed" : "web_speech"),
    durationSec: store.practice.elapsedSec,
  });
  if (error) throw error;
}

async function persistSessionComplete(points, mood, dayUnlocked) {
  const session = await store.practice.sessionPromise;
  if (!session?.id) return { alreadyShown: true, empty: true };
  return completeSession(session.id, moodToConfidence(mood), points, dayUnlocked);
}

export function wireSession(deps) {
  stopTimer = deps.stopTimer;
  route = deps.route;
  renderPractice = deps.renderPractice;
  spawnConfetti = deps.spawnConfetti;
  showToast = deps.showToast || showToast;
  showDailyDigest = deps.showDailyDigest || showDailyDigest;
  $ = deps.$;
}

export const APP_CONFIG = {
  appName: "ByoU",
  tagline: "Speak English with confidence — 5 minutes a day",
  streakResetHour: 4,
  weeklyGoalDays: 5,
  N8N_WEBHOOK_URL: "",
};

export const ONBOARDING_TOUR = [
  { id: "home", title: "Your daily home", body: "Every day you'll see a fresh mission and your streak. Tap it to start practising in under a minute.", icon: "home" },
  { id: "mic", title: "Just press and talk", body: "Tap the mic, answer the prompt in your own words. ByoU transcribes and gives you friendly feedback.", icon: "mic" },
  { id: "feedback", title: "Feedback that helps", body: "You'll see filler words, clarity, and a better way to say it — never harsh, always actionable.", icon: "feedback" },
  { id: "rewards", title: "Build your streak", body: "Finish a mission to earn points and keep your streak alive. Consistency beats perfection.", icon: "trophy" },
];

export const FLASHCARDS = [
  { id: "fc1", word: "actually", meaning: "used to clarify or correct gently", example: "I actually think that's a great idea.", ipa: "ˈæktʃuəli" },
  { id: "fc2", word: "absolutely", meaning: "with complete certainty; yes for sure", example: "Absolutely, I can help with that.", ipa: "ˈæbsəluːtli" },
  { id: "fc3", word: "essentially", meaning: "at its core; most importantly", example: "Essentially, it comes down to timing.", ipa: "ɪˈsenʃəli" },
  { id: "fc4", word: "genuinely", meaning: "truly; really", example: "I genuinely enjoyed working on that project.", ipa: "ˈdʒenjuɪnli" },
  { id: "fc5", word: "confidently", meaning: "with certainty; boldly", example: "I can confidently say I learned a lot.", ipa: "ˈkɒnfɪdəntli" },
  { id: "fc6", word: "specifically", meaning: "in a particular way; precisely", example: "Specifically, I worked on the backend team.", ipa: "spəˈsɪfɪkli" },
  { id: "fc7", word: "worthwhile", meaning: "worth the time or effort; valuable", example: "The training was worthwhile for my career.", ipa: "ˌwɜːθˈwaɪl" },
  { id: "fc8", word: "initiative", meaning: "taking action without being told", example: "I took the initiative to lead the project.", ipa: "ɪˈnɪʃətɪv" },
  { id: "fc9", word: "collaborate", meaning: "work together with others", example: "I love to collaborate with different teams.", ipa: "kəˈlæbəreɪt" },
  { id: "fc10", word: "enthusiastic", meaning: "excited and eager", example: "I'm enthusiastic about this opportunity.", ipa: "ɪnˌθjuːziˈæstɪk" },
];

export const PROMPTS = [
  { id: "p1", text: "Tell me about your hometown. What do you love most about it?", difficulty: "easy", hint: "Try: name the city, mention one thing you enjoy, share a small memory.", idealKeywords: ["hometown", "love", "enjoy", "grew", "city", "place"] },
  { id: "p2", text: "Describe a skill you're proud of and how you learned it.", difficulty: "easy", hint: "Name the skill, say how long it took, mention who taught you.", idealKeywords: ["skill", "learned", "practice", "proud", "taught"] },
  { id: "p3", text: "If you could have dinner with anyone, who would it be and why?", difficulty: "medium", hint: "Pick a person, give one reason, imagine one question you'd ask them.", idealKeywords: ["dinner", "person", "because", "ask", "admire"] },
  { id: "p4", text: "You're in a job interview. Tell me about a challenge you overcame.", difficulty: "hard", hint: "Set the scene, describe the action you took, share the result.", idealKeywords: ["challenge", "overcame", "situation", "result", "team", "problem"] },
  { id: "p5", text: "Convince me to visit your favourite restaurant.", difficulty: "medium", hint: "Name the place, describe the food, give one reason I should go.", idealKeywords: ["restaurant", "food", "favourite", "recommend", "delicious", "ambience"] },
  { id: "p6", text: "What's a book or movie that changed how you think? Explain why?", difficulty: "medium", hint: "Name it, say what changed, mention one specific moment.", idealKeywords: ["book", "movie", "changed", "think", "because", "story"] },
];

export const MISSIONS = [
  { id: "m1", title: "'Tell me about yourself' — retail interview", subtitle: "5 minutes · 2 questions", type: "prompt", difficulty: "easy", points: 20 },
  { id: "m2", title: "Flashcard warm-up", subtitle: "20 words · ~90 sec", type: "flashcard", difficulty: "easy", points: 10 },
  { id: "m3", title: "A challenge you overcame", subtitle: "5 minutes · 2 questions", type: "prompt", difficulty: "hard", points: 35 },
];

export const BADGES = [
  { id: "b1", name: "First Session", desc: "Finish your first mission", icon: "message", threshold: 1, field: "missionsCompleted" },
  { id: "b2", name: "3-Day Streak", desc: "Practice 3 days in a row", icon: "flame", threshold: 3, field: "streak" },
  { id: "b3", name: "Comeback", desc: "Start a new streak after a break", icon: "calendar", threshold: 1, field: "missionsCompleted" },
  { id: "b4", name: "100 Words", desc: "Learn 100 flashcards", icon: "book", threshold: 100, field: "flashcardsLearned" },
  { id: "b5", name: "Century Club", desc: "Earn 100 points", icon: "star", threshold: 100, field: "points" },
];

export const LEADERBOARD = [
  { name: "Aarav", points: 420, avatar: "A" },
  { name: "Priya", points: 385, avatar: "P" },
  { name: "You", points: 0, avatar: "U", isYou: true },
  { name: "Kabir", points: 210, avatar: "K" },
  { name: "Meera", points: 175, avatar: "M" },
  { name: "Dev", points: 120, avatar: "D" },
];

export const SETTINGS_OPTIONS = [
  { id: "notifications", label: "Daily reminder", type: "toggle" },
  { id: "privacy", label: "Terms & Privacy", type: "link" },
  { id: "help", label: "Help & support", type: "link" },
];

export const FEEDBACK_TEMPLATES = {
  worked: [
    "You said '{quote}' — that's a great way to start. It shows confidence and sets up your answer naturally.",
    "Using '{quote}' was a smart choice. It makes your answer feel genuine and easy to follow.",
    "'{quote}' works really well here. It's the kind of phrase interviewers love to hear.",
  ],
  upgrade: [
    "Instead of '{quote}', try '{better}'. {why}",
    "You said '{quote}'. A smoother version: '{better}'. {why}",
    "'{quote}' is fine, but '{better}' sounds more natural. {why}",
  ],
  drill: [
    "Say the upgraded line once more to lock it in.",
    "Practise the new version aloud — your mouth will remember it next time.",
    "One more try with the smoother version. You've got this!",
  ],
};

export const MOOD_OPTIONS = [
  { id: "nervous", label: "Nervous", emoji: "😟" },
  { id: "okay", label: "Okay", emoji: "😐" },
  { id: "good", label: "Good", emoji: "🙂" },
  { id: "great", label: "Great!", emoji: "😄" },
];

export const COURSES = {
  interview: { id: "interview", name: "Interview Preparation", emoji: "🎯", tagline: "Crack your next job interview. 30 days.", weeks: interviewWeeks },
  conversation: { id: "conversation", name: "General Conversation", emoji: "💬", tagline: "Speak easily in daily life. 30 days.", weeks: conversationWeeks },
  combined: { id: "combined", name: "Interview + Conversation", emoji: "🚀", tagline: "The complete course. 30 days.", weeks: combinedWeeks },
};

export function getCourseDay(courseId, day) {
  const key = uiCourseId(courseId) || courseId;
  const course = COURSES[key];
  if (!course?.weeks) return null;
  const n = Number(day);
  for (const week of course.weeks) {
    const found = week.days.find((d) => d.day === n);
    if (found) return found;
  }
  return null;
}

export const MOCK_DAYS = [7, 14, 21, 28];
export const FREE_TIER_MAX_DAY = 7;
export const PAYWALL_ENABLED = false;

export function isDayLocked(day) {
  if (!PAYWALL_ENABLED) return false;
  return store.auth?.user?.plan === "free" && Number(day) > FREE_TIER_MAX_DAY;
}

const defaultProgress = {
  streak: 0, lastPracticeDate: null, points: 0, missionsCompleted: 0, flashcardsLearned: 0,
  weeklyMinutes: 0, weeklyStartDay: null, practiceDays: [], seenTour: false, moodHistory: [],
  lastMissionId: null, courseDay: 1, completedDays: [], dayScores: {}, simDateOffset: 0,
};

function applyHydratedProgress(h) {
  if (!h) return;
  const localDay = Number(store.progress.courseDay) || 1;
  const hydratedDay = Number(h.courseDay) || 1;
  const courseDay = Math.max(localDay, hydratedDay);
  let completedDays = h.completedDays ?? [];
  if (localDay > hydratedDay) {
    completedDays = completedDays.filter((d) => d !== courseDay);
  }
  store.progress = {
    ...store.progress,
    streak: h.streakDays ?? 0,
    points: h.totalPoints ?? 0,
    completedDays,
    courseDay,
    seenTour: !!(store.progress.seenTour || h.seenTour),
    lastPracticeDate: h.lastActiveDate ?? store.progress.lastPracticeDate,
    practiceDays: h.practiceDays ?? store.progress.practiceDays,
    weeklyStartDay: mondayOfWeek(store.progress.simDateOffset),
  };
}

export function todayStr(offset = 0) {
  return localTodayStr(offset);
}

export function daysBetween(a, b) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function updateStreakOnPractice(prog) {
  const today = todayStr(prog.simDateOffset);
  if (prog.lastPracticeDate === today) return prog;
  let newStreak = 1;
  if (prog.lastPracticeDate) {
    const gap = daysBetween(prog.lastPracticeDate, today);
    if (gap === 1) newStreak = prog.streak + 1;
    else if (gap === 0) newStreak = prog.streak;
    else newStreak = 1;
  }
  const practiceDays = prog.practiceDays.includes(today) ? prog.practiceDays : [...prog.practiceDays, today];
  return { ...prog, streak: newStreak, lastPracticeDate: today, practiceDays };
}

export function isSameWeek(weeklyStartDay, offset = 0) {
  if (!weeklyStartDay) return false;
  return daysBetween(weeklyStartDay, todayStr(offset)) < 7;
}

const UPGRADE_PAIRS = [
  { from: "very good", to: "excellent", why: "one strong word beats two weak ones." },
  { from: "i think", to: "I'd say", why: "it sounds more natural and confident." },
  { from: "a lot of", to: "plenty of", why: "it's smoother and less repetitive." },
  { from: "kind of", to: "somewhat", why: "it's more precise and professional." },
  { from: "really", to: "truly", why: "it adds emphasis without sounding casual." },
  { from: "get", to: "gain", why: "it sounds more professional in an interview." },
  { from: "stuff", to: "tasks", why: "it's clearer and more specific." },
];

function countWords(transcript) {
  const trimmed = transcript.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function extractQuote(transcript) {
  const words = transcript.trim().split(/\s+/);
  if (words.length <= 6) return transcript.trim();
  const start = Math.min(2, words.length - 3);
  return words.slice(start, start + 4).join(" ");
}

function findUpgrade(transcript) {
  const lower = transcript.toLowerCase();
  for (const pair of UPGRADE_PAIRS) {
    if (lower.includes(pair.from)) {
      const idx = lower.indexOf(pair.from);
      return { quote: transcript.substring(idx, idx + pair.from.length), better: pair.to, why: pair.why };
    }
  }
  return null;
}

export function generateFeedback(transcript, _idealKeywords, templates) {
  const wordCount = countWords(transcript);
  const quote = wordCount > 0 ? extractQuote(transcript) : "your answer";
  const upgrade = findUpgrade(transcript);
  const workedBody = wordCount === 0
    ? "You showed up and tried — that's the hardest part. Coming back tomorrow will feel easier."
    : templates.worked[Math.floor(Math.random() * templates.worked.length)].replace("{quote}", quote);
  const chunks = [{ id: "worked", icon: "worked", title: "What worked", body: workedBody, tone: "positive" }];
  if (upgrade) {
    const upgradeBody = templates.upgrade[Math.floor(Math.random() * templates.upgrade.length)]
      .replace("{quote}", upgrade.quote).replace("{better}", upgrade.better).replace("{why}", upgrade.why);
    chunks.push({ id: "upgrade", icon: "upgrade", title: "One upgrade", body: upgradeBody, tone: "tip", quote: upgrade.quote, better: upgrade.better });
  } else {
    chunks.push({
      id: "upgrade", icon: "upgrade", title: "One upgrade",
      body: wordCount > 0
        ? `Try linking your sentences: "I grew up there, which is why I love it." It makes your ideas flow naturally.`
        : "Next time, try starting with 'I'd say…' to sound natural and confident.",
      tone: "tip",
    });
  }
  chunks.push({
    id: "drill", icon: "drill", title: "Say it once more",
    body: templates.drill[Math.floor(Math.random() * templates.drill.length)],
    tone: "drill",
  });
  return chunks;
}

export const store = {
  auth: { user: null, rememberMe: false },
  progress: { ...defaultProgress },
  tab: "home",
  overlay: null,
  feedbackLogFrom: "home",
  courseDayOverride: null,
  selectedCourseId: "combined",
  tourStep: 0,
  rememberMe: true,
  notifEnabled: true,
  coursePlanExpanded: 1,
  showLeaderboard: false,
  showAllBadges: false,
  practiceFromTab: false,
  editingName: false,
  nameInput: "",
  authScreen: "welcome",
  feedback: {
    helpful: null,
    reportOpen: false,
    reportText: "",
  },
  practice: {
    promptIdx: 0,
    micState: "idle",
    transcript: "",
    liveText: "",
    feedback: null,
    showHint: false,
    showMood: false,
    completedCount: 0,
    typingMode: false,
    typedText: "",
    elapsedSec: 0,
    transcriptRef: "",
    timer: null,
    courseQuestions: null,
    dayNum: null,
    listeningFlag: false,
    sessionId: null,
    sessionPromise: null,
    questionIds: [],
    resaying: false,
    audioBlob: null,
    sttEngine: null,
    emptySttCount: 0,
    aiFeedback: null,
    lastSpeechAt: 0,
    silenceTimeout: false,
    sttFailed: false,
  },
  flash: { idx: 0, flipped: false, learned: 0, done: false, exitDir: null, cards: null, drill: "idle", retry: [], dealtOn: null, shownIds: [], loadError: null, nudge: false, spokenCount: 0 },
};

export async function markTourSeen() {
  store.progress = { ...store.progress, seenTour: true };
  const { error } = await updateProfile({ seen_tour: true });
  if (error) console.error(error);
}

export async function saveDisplayName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed || !store.auth.user) return;
  store.auth = { ...store.auth, user: { ...store.auth.user, name: trimmed } };
  const { error } = await updateProfile({ display_name: trimmed });
  if (error) console.error(error);
}

export function practiceQuestions() {
  const hasCourseQs = store.practice.courseQuestions && store.practice.courseQuestions.length > 0;
  const lesson = store.auth.user?.courseId ? getCourseDay(store.auth.user.courseId, currentCourseDay(store.courseDayOverride)) : null;
  const phraseHint = (lesson?.phrases || []).filter(Boolean).join(" ");
  if (hasCourseQs) {
    return store.practice.courseQuestions.map((q, i) => {
      if (typeof q === "string") {
        return {
          id: `cq-${i}`,
          text: q,
          difficulty: "easy",
          hint: phraseHint || DEFAULT_HINT,
          idealKeywords: [],
        };
      }
      return {
        id: q.id ?? `cq-${i}`,
        text: q.text || q.prompt || "",
        difficulty: "easy",
        hint: q.hint || phraseHint || DEFAULT_HINT,
        idealKeywords: [],
      };
    });
  }
  if (store.auth.user?.courseId) {
    const fallback = lessonQuestionsForDay(currentCourseDay(store.courseDayOverride));
    if (fallback?.length) {
      return fallback.map((q, i) => ({
        id: `cq-${i}`,
        text: q,
        difficulty: "easy",
        hint: phraseHint || DEFAULT_HINT,
        idealKeywords: [],
      }));
    }
  }
  return PROMPTS;
}

export function resetForNext() {
  store.practice.feedback = null;
  store.practice.aiFeedback = null;
  store.practice.transcript = "";
  store.practice.liveText = "";
  store.practice.transcriptRef = "";
  store.practice.showHint = false;
  store.practice.typedText = "";
  store.practice.elapsedSec = 0;
  store.practice.silenceTimeout = false;
  store.practice.sttFailed = false;
  store.practice.lastSpeechAt = 0;
  stopTimer();
}

export function startPractice({ fromTab = false, courseDay = null } = {}) {
  const dayNum = store.auth.user?.courseId ? currentCourseDay(courseDay) : null;
  store.practiceFromTab = fromTab;
  store.courseDayOverride = dayNum;
  store.practice.promptIdx = 0;
  store.practice.micState = "idle";
  store.practice.transcript = "";
  store.practice.liveText = "";
  store.practice.feedback = null;
  store.practice.showHint = false;
  store.practice.showMood = false;
  store.practice.completedCount = 0;
  store.practice.typingMode = false;
  store.practice.typedText = "";
  store.practice.elapsedSec = 0;
  store.practice.transcriptRef = "";
  store.practice.sessionId = null;
  store.practice.questionIds = [];
  store.practice.resaying = false;
  store.practice.audioBlob = null;
  store.practice.sttEngine = null;
  store.practice.emptySttCount = 0;
  store.practice.sttFailed = false;
  store.practice.aiFeedback = null;
  store.feedback.helpful = null;
  stopTimer();
  store.practice.courseQuestions = lessonQuestionsForDay(dayNum);
  store.practice.dayNum = dayNum;
  store.practice.sessionPromise = persistSessionStart(dayNum)
    .then((session) => {
      const prompt = practiceQuestions()[store.practice.promptIdx];
      track("question_shown", {
        q_id: store.practice.questionIds[store.practice.promptIdx] ?? prompt?.id ?? null,
        position: store.practice.promptIdx + 1,
      });
      return session;
    })
    .catch((err) => {
    store.practice.sessionId = null;
    if (applyQuestionsForDay(dayNum, [])) {
      if (store.overlay === "practice" || store.tab === "practice") renderPractice();
    }
    console.error(err);
    return null;
  });
  if (fromTab) { store.overlay = null; store.tab = "practice"; }
  else store.overlay = "practice";
  route();
  renderPractice();
}

export async function handlePracticeComplete(points, mood) {
  const withStreak = updateStreakOnPractice(store.progress);
  const dayNum = store.courseDayOverride || withStreak.courseDay;
  const completedDays = withStreak.completedDays.includes(dayNum) ? withStreak.completedDays : [...withStreak.completedDays, dayNum];
  let nextCourseDay = withStreak.courseDay;
  if (dayNum === withStreak.courseDay && !withStreak.completedDays.includes(dayNum)) {
    nextCourseDay = Math.min(30, withStreak.courseDay + 1);
  }
  store.progress = {
    ...withStreak,
    points: withStreak.points + points,
    missionsCompleted: withStreak.missionsCompleted + 1,
    weeklyMinutes: withStreak.weeklyMinutes + 5,
    weeklyStartDay: withStreak.weeklyStartDay || todayStr(withStreak.simDateOffset),
    lastMissionId: MISSIONS[0].id,
    completedDays,
    courseDay: nextCourseDay,
    moodHistory: mood !== "" ? [...withStreak.moodHistory, { date: todayStr(withStreak.simDateOffset), mood }] : withStreak.moodHistory,
  };
  store.courseDayOverride = null;
  store.practice.showMood = false;
  store.feedback.helpful = "hidden";
  track("session_completed", { q_answered: store.practice.completedCount, day_number: dayNum });
  try {
    const digest = await persistSessionComplete(points, mood, dayNum);
    try {
      const { data } = await hydrateUserState();
      applyHydratedProgress(data);
    } catch (hydrateErr) {
      console.error(hydrateErr);
    }
    if (digest && !digest.alreadyShown && !digest.empty) {
      store.overlay = "digest";
      store.tab = "home";
      route();
      showDailyDigest(digest);
      markDigestShown().catch((err) => console.error(err));
      return true;
    }
    store.overlay = null;
    store.tab = "home";
    route();
    return false;
  } catch (err) {
    console.error(err);
    showToast("Couldn't save today's session. Try again in a moment.");
    store.overlay = "practice";
    store.practice.showMood = true;
    renderPractice();
    return false;
  }
}

export async function refreshHomeData() {
  await refreshProgressFromDb();
  store.overlay = null;
  store.tab = "home";
  store.practice.showMood = false;
  route();
}

export function practiceExit() {
  if (store.practiceFromTab) store.tab = "home";
  store.overlay = null;
  store.courseDayOverride = null;
  route();
}

export async function handleFlashcardComplete(learned) {
  store.flash.nudge = false;
  store.overlay = null;
  const add = learned * 2;
  store.progress = {
    ...store.progress,
    points: store.progress.points + add,
    flashcardsLearned: store.progress.flashcardsLearned + learned,
    weeklyMinutes: store.progress.weeklyMinutes + 3,
    weeklyStartDay: store.progress.weeklyStartDay || todayStr(store.progress.simDateOffset),
  };
  store.tab = "home";
  try {
    const user = await requireUser();
    const { data: profile } = await supabase.from("profiles").select("total_points").eq("id", user.id).maybeSingle();
    const { error } = await supabase.from("profiles")
      .update({ total_points: (profile?.total_points ?? 0) + add })
      .eq("id", user.id);
    if (error) throw error;
    const { data } = await hydrateUserState();
    applyHydratedProgress(data);
  } catch (err) {
    console.error(err);
  }
  route();
}

export function submitAnswer(textOrResult) {
  const started = Date.now();
  const fromLadder = textOrResult && typeof textOrResult === "object";
  const raw = fromLadder ? String(textOrResult.transcript || "") : String(textOrResult || "");
  const engine = fromLadder && textOrResult.engine
    ? textOrResult.engine
    : (store.practice.typingMode ? "typed" : "web_speech");
  store.practice.sttEngine = engine;
  track("stt_result", { engine, empty: !raw.trim(), chars: raw.length });
  if (store.practice.resaying) {
    track("resay_completed");
    store.practice.resaying = false;
  }
  store.practice.micState = "processing";
  renderPractice();
  store.practice.transcript = raw;
  requestAiFeedback(raw, engine, { silenceTimeout: fromLadder && textOrResult.silenceTimeout })
    .then((payload) => {
      showFeedback(payload, raw, started);
    })
    .catch(() => {
      showFeedback(SAFE_FEEDBACK, raw, started);
    });
}

function showFeedback(payload, transcript, started) {
  store.practice.aiFeedback = payload;
  store.practice.feedback = toFeedbackChunks(payload);
  store.practice.micState = "idle";
  renderPractice();
  spawnConfetti($("practice-confetti"));
  track("feedback_shown", { latency_ms: Date.now() - started });
  persistAnswer(transcript).catch((err) => console.error(err));
}

export async function applyAuthSession(session) {
  const u = session?.user;
  if (!u) {
    store.auth = { user: null, rememberMe: false };
    store.progress = { ...defaultProgress };
    return;
  }
  const meta = u.user_metadata || {};
  const email = u.email || "";
  const fallbackName = meta.full_name || meta.name || (email ? email.split("@")[0] : "You");
  let h = null;
  try {
    const res = await hydrateUserState();
    h = res.data;
  } catch (err) {
    console.error(err);
  }
  store.auth = {
    user: {
      id: u.id,
      email,
      name: h?.displayName || fallbackName,
      goal: "",
      createdAt: Date.parse(u.created_at) || Date.now(),
      courseId: h?.courseId ?? null,
      plan: h?.plan || "free",
    },
    rememberMe: true,
  };
  applyHydratedProgress(h);
}

export function handleLogout() {
  signOut().catch(() => {});
  store.auth = { user: null, rememberMe: false };
  store.progress = { ...defaultProgress };
  store.authScreen = "welcome";
  store.tab = "home";
  store.overlay = null;
  route();
}

export async function handleCourseSelect(courseId) {
  const picked = courseId || store.selectedCourseId;
  if (!store.auth.user || !picked) return;

  const btn = document.getElementById("course-start");
  const msg = document.getElementById("course-start-msg");
  const original = btn?.innerHTML;
  if (btn) btn.disabled = true;
  if (msg) {
    msg.classList.remove("hidden");
    msg.textContent = "Starting…";
  }

  try {
    track("course_selected", { course_id: picked });
    const { error } = await updateProfile({ course_id: dbCourseId(picked) });
    if (error) throw error;
    store.auth = { ...store.auth, user: { ...store.auth.user, courseId: picked } };
    store.progress = { ...store.progress, courseDay: 1, completedDays: [], dayScores: {}, seenTour: true };
    store.overlay = null;
    store.tab = "home";
    route();
  } catch (err) {
    console.error(err);
    if (msg) msg.textContent = err.message || "Couldn't save that course. Try again.";
    if (btn) {
      btn.disabled = false;
      if (original) btn.innerHTML = original;
    }
  }
}

export async function handleSelectPlan(plan) {
  if (!store.auth.user) return;
  const { error } = await updateProfile({ plan });
  if (error) {
    console.error(error);
    return;
  }
  store.auth = { ...store.auth, user: { ...store.auth.user, plan } };
  store.overlay = null;
  route();
}
