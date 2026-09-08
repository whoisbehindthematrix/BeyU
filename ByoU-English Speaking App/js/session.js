export const APP_CONFIG = {
  appName: "ByoU",
  tagline: "Speak English with confidence — 5 minutes a day",
  otpCode: "123456",
  streakResetHour: 4,
  weeklyGoalDays: 5,
  DEMO_MODE: true,
  N8N_WEBHOOK_URL: "",
};

export const AUTH_COPY = {
  signup: { ok: "Looks good ✓", weak: "Use at least 8 characters" },
  otp: { subtitle: (email) => `We sent a 6-digit code to ${email}.` },
};

export const ONBOARDING_TOUR = [
  { id: "home", title: "Your daily home", body: "Every day you'll see a fresh mission and your streak. Tap it to start practising in under a minute.", icon: "home" },
  { id: "mic", title: "Just press and talk", body: "Tap the mic, answer the prompt in your own words. ByoU transcribes and gives you friendly feedback.", icon: "mic" },
  { id: "feedback", title: "Feedback that helps", body: "You'll see filler words, clarity, and a better way to say it — never harsh, always actionable.", icon: "feedback" },
  { id: "rewards", title: "Build your streak", body: "Finish a mission to earn points and keep your streak alive. Consistency beats perfection.", icon: "trophy" },
];

export const FLASHCARDS = [
  { id: "fc1", word: "actually", meaning: "used to clarify or correct gently", example: "I actually think that's a great idea." },
  { id: "fc2", word: "absolutely", meaning: "with complete certainty; yes for sure", example: "Absolutely, I can help with that." },
  { id: "fc3", word: "essentially", meaning: "at its core; most importantly", example: "Essentially, it comes down to timing." },
  { id: "fc4", word: "genuinely", meaning: "truly; really", example: "I genuinely enjoyed working on that project." },
  { id: "fc5", word: "confidently", meaning: "with certainty; boldly", example: "I can confidently say I learned a lot." },
  { id: "fc6", word: "specifically", meaning: "in a particular way; precisely", example: "Specifically, I worked on the backend team." },
  { id: "fc7", word: "worthwhile", meaning: "worth the time or effort; valuable", example: "The training was worthwhile for my career." },
  { id: "fc8", word: "initiative", meaning: "taking action without being told", example: "I took the initiative to lead the project." },
  { id: "fc9", word: "collaborate", meaning: "work together with others", example: "I love to collaborate with different teams." },
  { id: "fc10", word: "enthusiastic", meaning: "excited and eager", example: "I'm enthusiastic about this opportunity." },
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
  { id: "myData", label: "My data", type: "link" },
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

function comingDays(start, n) {
  return Array.from({ length: n }, (_, i) => ({ day: start + i, title: "Coming up…", questions: [], phrases: [] }));
}

const interviewWeeks = [
  {
    week: 1,
    title: "Introduce yourself with confidence",
    days: [
      { day: 1, title: "Tell me about yourself", questions: ["Tell me about yourself.", "What did you study?"], phrases: ["I'm ___. I completed ___ in ___.", "I studied ___ at ___."] },
      { day: 2, title: "Your education story", questions: ["Why did you choose that course?", "What did you enjoy most in your studies?"], phrases: ["I chose ___ because ___.", "The part I enjoyed most was ___."] },
      { day: 3, title: "Your skills", questions: ["What are you good at?", "Give me an example of using that skill."], phrases: ["I'm good at ___.", "For example, once I ___."] },
      { day: 4, title: "Your goal", questions: ["What kind of job are you looking for?", "Why this field?"], phrases: ["I'm looking for a role in ___.", "This field suits me because ___."] },
      { day: 5, title: "Your work or training", questions: ["Tell me about your last project or training.", "What was your responsibility?"], phrases: ["In my training, I worked on ___.", "I was responsible for ___."] },
      { day: 6, title: "Your 60-second introduction", questions: ["Introduce yourself in one minute.", "What makes you a good hire?"], phrases: ["To introduce myself, ___.", "In short, I can ___."] },
      { day: 7, title: "Week 1 review — mini mock", questions: ["Tell me about yourself.", "What are you good at?"], phrases: ["Review all phrases from this week."] },
    ],
  },
  { week: 2, title: "Talk about your work", days: comingDays(8, 7) },
  { week: 3, title: "The classic questions", days: comingDays(15, 7) },
  { week: 4, title: "Pressure-proof", days: comingDays(22, 9) },
];

const conversationWeeks = [
  {
    week: 1,
    title: "Everyday small talk",
    days: [
      { day: 1, title: "Greetings that go further", questions: ["How are you doing today, really?", "How was your morning?"], phrases: ["Honestly, today has been ___.", "My morning was ___ because ___."] },
      { day: 2, title: "Your weekend", questions: ["What did you do this weekend?", "What was the best part?"], phrases: ["This weekend I ___.", "The best part was ___."] },
      { day: 3, title: "Your daily routine", questions: ["Walk me through your normal day.", "What part of the day do you like most?"], phrases: ["Usually I start my day with ___.", "After that, I ___."] },
      { day: 4, title: "Small talk starters", questions: ["How's the weather there today?", "How do you travel to work or college?"], phrases: ["It's quite ___ today.", "I usually take the ___."] },
      { day: 5, title: "Food you love", questions: ["What's your favourite food?", "How is it made?"], phrases: ["My favourite food is ___.", "First you ___, then you ___."] },
      { day: 6, title: "Your city", questions: ["Tell me about your city or neighbourhood.", "What should a visitor see?"], phrases: ["I live in ___, which is known for ___.", "You should definitely visit ___."] },
      { day: 7, title: "Free talk Friday", questions: ["Pick any topic and talk for one minute."], phrases: ["Let me tell you about ___."] },
    ],
  },
  { week: 2, title: "Plans & stories", days: comingDays(8, 7) },
  { week: 3, title: "Opinions & reactions", days: comingDays(15, 7) },
  { week: 4, title: "Real-world situations", days: comingDays(22, 9) },
];

const combinedWeeks = [
  {
    week: 1,
    title: "The complete path — Week 1",
    days: [
      interviewWeeks[0].days[0],
      interviewWeeks[0].days[1],
      interviewWeeks[0].days[2],
      interviewWeeks[0].days[3],
      { ...conversationWeeks[0].days[1], day: 5 },
      { ...conversationWeeks[0].days[2], day: 6 },
      { day: 7, title: "Mixed review — mini mock", questions: ["Tell me about yourself.", "What did you do this weekend?"], phrases: ["Review all phrases from this week."] },
    ],
  },
  { week: 2, title: "The complete path — Week 2", days: comingDays(8, 7) },
  { week: 3, title: "The complete path — Week 3", days: comingDays(15, 7) },
  { week: 4, title: "The complete path — Week 4", days: comingDays(22, 9) },
];

export const COURSES = {
  interview: { id: "interview", name: "Interview Preparation", emoji: "🎯", tagline: "Crack your next job interview. 30 days.", weeks: interviewWeeks },
  conversation: { id: "conversation", name: "General Conversation", emoji: "💬", tagline: "Speak easily in daily life. 30 days.", weeks: conversationWeeks },
  combined: { id: "combined", name: "Interview + Conversation", emoji: "🚀", tagline: "The complete course. 30 days.", weeks: combinedWeeks },
};

export function getCourseDay(courseId, day) {
  const course = COURSES[courseId];
  for (const week of course.weeks) {
    const found = week.days.find((d) => d.day === day);
    if (found) return found;
  }
  return null;
}

export const MOCK_DAYS = [7, 14, 21, 28];
export const FREE_TIER_MAX_DAY = 7;

const STORAGE_KEYS = { auth: "byou_auth", progress: "byou_progress", prefs: "byou_prefs" };

const defaultProgress = {
  streak: 0, lastPracticeDate: null, points: 0, missionsCompleted: 0, flashcardsLearned: 0,
  weeklyMinutes: 0, weeklyStartDay: null, practiceDays: [], seenTour: false, moodHistory: [],
  lastMissionId: null, courseDay: 1, completedDays: [], dayScores: {}, simDateOffset: 0,
};

export function loadAuth() {
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

export function saveAuth(state) {
  localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(state));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.auth);
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.progress);
    if (!raw) return { ...defaultProgress };
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return { ...defaultProgress };
  }
}

export function saveProgress(state) {
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(state));
}

export function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
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


const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "actually", "literally", "sort of", "kind of", "yeah", "so yeah"];
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


export const hooks = {
  route() {},
  renderPractice() {},
  spawnPracticeConfetti() {},
};

export const store = {
  auth: loadAuth(),
  progress: loadProgress(),
  pendingUser: null,
  pendingEmail: "",
  tab: "home",
  overlay: null,
  courseDayOverride: null,
  selectedCourseId: "combined",
  tourStep: 0,
  consentVoice: false,
  consentTerms: false,
  rememberMe: true,
  notifEnabled: true,
  deleteConfirmed: false,
  coursePlanExpanded: 1,
  showLeaderboard: false,
  showAllBadges: false,
  practiceFromTab: false,
  editingName: false,
  nameInput: "",
  authScreen: "welcome",
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
    listeningFlag: false,
  },
  flash: { idx: 0, flipped: false, learned: 0, done: false, exitDir: null },
};

export function persistProgress() { saveProgress(store.progress); }

export function practiceQuestions() {
  const practice = store.practice;
  const hasCourseQs = practice.courseQuestions && practice.courseQuestions.length > 0;
  if (hasCourseQs) {
    return practice.courseQuestions.map((q, i) => ({
      id: `cq-${i}`, text: q, difficulty: "easy",
      hint: "Take your time. Start with 'I would say...' and build from there.",
      idealKeywords: [],
    }));
  }
  return PROMPTS;
}

export function stopTimer() {
  const practice = store.practice;
  if (practice.timer) { clearInterval(practice.timer); practice.timer = null; }
}

export function startTimer() {
  const practice = store.practice;
  practice.elapsedSec = 0;
  practice.timer = setInterval(() => { practice.elapsedSec += 1; hooks.renderPractice(); }, 1000);
}

export function resetForNext() {
  const practice = store.practice;
  practice.feedback = null;
  practice.transcript = "";
  practice.liveText = "";
  practice.transcriptRef = "";
  practice.showHint = false;
  practice.typedText = "";
  practice.elapsedSec = 0;
  stopTimer();
}

export function submitAnswer(text) {
  const practice = store.practice;
  practice.micState = "processing";
  hooks.renderPractice();
  setTimeout(() => {
    const questions = practiceQuestions();
    const prompt = questions[practice.promptIdx % questions.length];
    practice.transcript = text;
    practice.feedback = generateFeedback(text, prompt.idealKeywords, FEEDBACK_TEMPLATES);
    practice.micState = "idle";
    hooks.renderPractice();
    hooks.spawnPracticeConfetti();
  }, 1200);
}

export function startPractice({ fromTab = false, courseDay = null } = {}) {
  const practice = store.practice;
  store.practiceFromTab = fromTab;
  store.courseDayOverride = courseDay;
  practice.promptIdx = 0;
  practice.micState = "idle";
  practice.transcript = "";
  practice.liveText = "";
  practice.feedback = null;
  practice.showHint = false;
  practice.showMood = false;
  practice.completedCount = 0;
  practice.typingMode = false;
  practice.typedText = "";
  practice.elapsedSec = 0;
  practice.transcriptRef = "";
  stopTimer();
  if (courseDay && store.auth.user?.courseId) {
    const lesson = getCourseDay(store.auth.user.courseId, courseDay);
    practice.courseQuestions = lesson && lesson.questions.length > 0 ? lesson.questions : null;
  } else {
    practice.courseQuestions = null;
  }
  if (fromTab) { store.overlay = null; store.tab = "practice"; }
  else store.overlay = "practice";
  hooks.route();
  hooks.renderPractice();
}

export function handlePracticeComplete(points, mood) {
  store.overlay = null;
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
  store.tab = "rewards";
  persistProgress();
}

export function practiceExit() {
  if (store.practiceFromTab) store.tab = "home";
  store.overlay = null;
  store.courseDayOverride = null;
  hooks.route();
}

export function handleFlashcardComplete(learned) {
  store.overlay = null;
  const withStreak = updateStreakOnPractice(store.progress);
  store.progress = {
    ...withStreak,
    points: withStreak.points + learned * 2,
    flashcardsLearned: withStreak.flashcardsLearned + learned,
    weeklyMinutes: withStreak.weeklyMinutes + 3,
    weeklyStartDay: withStreak.weeklyStartDay || todayStr(withStreak.simDateOffset),
  };
  store.tab = "home";
  persistProgress();
  hooks.route();
}
