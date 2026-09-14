import {
  store,
  APP_CONFIG,
  ONBOARDING_TOUR,
  MISSIONS,
  BADGES,
  LEADERBOARD,
  SETTINGS_OPTIONS,
  MOOD_OPTIONS,
  COURSES,
  MOCK_DAYS,
  PAYWALL_ENABLED,
  isDayLocked,
  isLocalTestHost,
  practiceQuestions,
  getCourseDay,
  weekPracticeCount,
  resetFlashIfNewDay,
  refreshProgressFromDb,
} from "./session.js";
import { formatTime, handleTypedSubmit, speechController } from "./voice.js";
import { loadMyProgress } from "./progress.js";
import { FLASH_SET_SIZE, countSpokenWords, getDueWords, markSpoken, shuffleWords } from "./vocab.js";

export function $(id) { return document.getElementById(id); }
export function svg(name, size = 20) {
  const s = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const p = {
    check: `<path d="M20 6 9 17l-5-5"/>`,
    x: `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
    home: `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
    mic: `<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>`,
    feedback: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
    trophy: `<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>`,
    flame: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`,
    layers: `<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>`,
    chevronRight: `<path d="m9 18 6-6-6-6"/>`,
    chevronDown: `<path d="m6 9 6 6 6-6"/>`,
    shield: `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>`,
    play: `<polygon points="6 3 20 12 6 21 6 3"/>`,
    book: `<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>`,
    volume: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>`,
    star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
    message: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
    calendar: `<rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y2="2" y1="6"/><line x1="8" x2="8" y2="2" y1="6"/><line x1="3" x2="21" y1="10"/>`,
    crown: `<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>`,
    settings: `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1 1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`,
    logout: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>`,
    trash: `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>`,
    fastForward: `<polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/>`,
    trending: `<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>`,
    repeat: `<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>`,
    rotate: `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>`,
    lightbulb: `<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>`,
    keyboard: `<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/>`,
    send: `<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>`,
    target: `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
    messageCircle: `<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>`,
    rocket: `<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>`,
    lock: `<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
  };
  return `<svg ${s}>${p[name] || ""}</svg>`;
}

export function showScreen(name) {
  if (store.practice.micState === "listening" && name === "practice") {
    const practice = document.querySelector('[data-screen="practice"]');
    if (practice && !practice.classList.contains("hidden")) return;
  }
  const screens = document.querySelectorAll("[data-screen]");
  let shown = null;
  screens.forEach((el) => {
    const on = el.getAttribute("data-screen") === name;
    el.classList.toggle("hidden", !on);
    if (on) shown = el;
  });
  if (!shown && screens.length) {
    const fallback = document.querySelector('[data-screen="welcome"]') || screens[0];
    fallback.classList.remove("hidden");
  }
}

export function showTabNav(show, active) {
  const nav = $("tabnav");
  if (!nav) return;
  if (!show) { nav.classList.add("hidden"); return; }
  nav.classList.remove("hidden");
  nav.querySelectorAll("[data-tab]").forEach((btn) => {
    const on = btn.getAttribute("data-tab") === active;
    const icon = btn.querySelector("[data-tab-icon]");
    const label = btn.querySelector("span");
    if (icon) {
      icon.setAttribute("stroke-width", on ? "2.5" : "2");
      icon.classList.toggle("text-brand-500", on);
      icon.classList.toggle("text-ink-400", !on);
    }
    if (label) {
      label.classList.toggle("text-brand-500", on);
      label.classList.toggle("text-ink-400", !on);
    }
    let dot = btn.querySelector(".tab-dot");
    if (on && !dot) {
      dot = document.createElement("div");
      dot.className = "tab-dot absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-500";
      btn.appendChild(dot);
    } else if (!on && dot) dot.remove();
  });
}

export function setOfflineBanner() {
  const b = $("offline-banner");
  if (!b) return;
  if (!navigator.onLine) b.classList.remove("hidden");
  else b.classList.add("hidden");
}

export function route() {
  try {
    routeToScreen();
  } catch (err) {
    console.error("route failed", err);
    const fallback = !store.auth.user
      ? (store.authScreen || "welcome")
      : (!store.auth.user.courseId ? "courseChooser" : "home");
    showTabNav(fallback === "home", "home");
    showScreen(fallback);
    if (fallback === "home") {
      try { renderHome(); } catch (e) { console.error(e); }
    }
    if (fallback === "courseChooser") {
      try { renderCourseChooser(); } catch (e) { console.error(e); }
    }
  }
}

function routeToScreen() {
  if (!store.auth.user) {
    showTabNav(false);
    showScreen(store.authScreen || "welcome");
    return;
  }
  if (!store.progress.seenTour) { showTabNav(false); showScreen("tour"); renderTour(); return; }
  if (!store.auth.user.courseId || store.overlay === "courseChooser") { showTabNav(false); showScreen("courseChooser"); renderCourseChooser(); return; }
  if (store.overlay === "practice") { showTabNav(false); showScreen("practice"); return; }
  if (store.overlay === "digest") { showTabNav(false); showScreen("digest"); return; }
  if (store.overlay === "feedbackLog") { showTabNav(false); showScreen("feedbackLog"); return; }
  if (store.overlay === "flashcard") { showTabNav(false); showScreen("flashcard"); renderFlashcard(); return; }
  if (store.overlay === "coursePlan") { showTabNav(false); showScreen("coursePlan"); renderCoursePlan(); return; }
  if (store.overlay === "progress") { showTabNav(false); showScreen("progress"); renderProgress(); return; }
  if (store.overlay === "plans") { showTabNav(false); showScreen("plans"); renderPlans(); return; }
  if (store.tab === "practice") { showTabNav(false); showScreen("practice"); return; }
  showTabNav(true, store.tab || "home");
  if (store.tab === "rewards") { showScreen("rewards"); renderRewards(); }
  else if (store.tab === "profile") { showScreen("profile"); renderProfile(); }
  else {
    showScreen("home");
    setOfflineBanner();
    resetFlashIfNewDay();
    renderHome();
    refreshProgressFromDb().then(() => {
      if (store.tab === "home" && !store.overlay) renderHome();
    }).catch((err) => console.error(err));
  }
}
export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function firstNameOf(user) {
  const name = String(user?.name || "").trim();
  if (name && name !== "You") return name.split(" ")[0];
  const local = String(user?.email || "").split("@")[0];
  if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  return "there";
}
export function renderHome() {
  const scroll = $("home-scroll");
  if (!scroll) return;
  const user = store.auth.user;
  const firstName = firstNameOf(user);
  const courseId = user?.courseId;
  const course = courseId ? COURSES[courseId] : null;
  const todayLesson = courseId ? getCourseDay(courseId, store.progress.courseDay) : null;
  const completedDays = Array.isArray(store.progress.completedDays) ? store.progress.completedDays : [];
  const dayDone = completedDays.includes(store.progress.courseDay);
  const locked = isDayLocked(store.progress.courseDay);
  const weeklyDays = weekPracticeCount(store.progress.practiceDays, store.progress.simDateOffset);
  const weeklyPct = Math.min(100, Math.round((weeklyDays / APP_CONFIG.weeklyGoalDays) * 100));
  const coursePct = Math.round((completedDays.length / 30) * 100);
  const size = 72, stroke = 8, radius = (size - stroke) / 2, circ = 2 * Math.PI * radius;
  const offset = circ - (weeklyPct / 100) * circ;
  const ringLabel = weeklyDays > 0 ? `${weeklyDays}/${APP_CONFIG.weeklyGoalDays}` : "";
  const ringSub = weeklyDays > 0 ? "days" : "";
  const questionCount = Array.isArray(todayLesson?.questions) ? todayLesson.questions.length : 0;

  let hero = "";
  if (course && todayLesson) {
    let cta = "";
    if (locked) {
      cta = `<button data-act="upgrade" class="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-600 shadow-soft transition-transform active:scale-95">${svg("book", 16)} Unlock with Pro</button>`;
    } else if (dayDone) {
      cta = `<div class="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold text-white">Done for today ✓</div>`;
    } else {
      cta = `<button data-act="start-day" data-day="${store.progress.courseDay}" class="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-600 shadow-soft transition-transform active:scale-95">${svg("play", 16)} Start today's lesson</button>`;
    }
    hero = `
      <div class="px-5">
        <button data-act="course-plan" class="mb-3 flex w-full items-center gap-3 rounded-xl bg-surface-0 px-4 py-3 shadow-soft transition-transform active:scale-[0.98]">
          <span class="text-lg">${course.emoji}</span>
          <div class="flex-1 min-w-0">
            <p class="truncate text-xs font-bold text-ink-800">${course.name}</p>
            <div class="mt-1 h-1.5 rounded-full bg-ink-200"><div class="h-1.5 rounded-full bg-brand-500 transition-all" style="width:${coursePct}%"></div></div>
          </div>
          <span class="text-xs font-bold text-brand-500">${coursePct > 0 ? `${coursePct}%` : "Begin"}</span>
          ${svg("chevronRight", 16)}
        </button>
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-pop">
          <div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"></div>
          <div class="absolute -right-4 top-12 h-20 w-20 rounded-full bg-white/5"></div>
          <div class="relative">
            <p class="text-xs font-semibold uppercase tracking-wide text-white/70">${coursePct === 0 ? "Day 1 of 30 — let’s begin" : `Day ${store.progress.courseDay} of 30`}</p>
            <h2 class="mt-1.5 text-lg font-bold leading-snug">${todayLesson.title}</h2>
            <p class="mt-1 text-sm text-white/70">${questionCount} questions · ~5 min</p>
            ${cta}
          </div>
        </div>
      </div>`;
  } else if (!course) {
    hero = `
      <div class="px-5">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-pop">
          <div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"></div>
          <div class="relative">
            <p class="text-xs font-semibold uppercase tracking-wide text-white/70">Today's mission</p>
            <h2 class="mt-1.5 text-lg font-bold leading-snug">${MISSIONS[0].title}</h2>
            <p class="mt-1 text-sm text-white/70">${MISSIONS[0].subtitle}</p>
            <button data-act="start-mission" data-id="${MISSIONS[0].id}" class="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-600 shadow-soft transition-transform active:scale-95">${svg("play", 16)} Start now</button>
          </div>
        </div>
      </div>`;
  }

  const missionsHtml = MISSIONS.slice(1).map((m) => `
    <button data-act="${m.type === "flashcard" ? "flashcards" : "start-mission"}" data-id="${m.id}" class="flex w-full items-center gap-3 rounded-2xl bg-surface-0 p-3.5 text-left shadow-soft transition-transform active:scale-[0.98]">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl ${m.type === "flashcard" ? "bg-success-500/10 text-success-500" : m.difficulty === "hard" ? "bg-accent-500/10 text-accent-500" : "bg-amber-500/10 text-amber-500"}">
        ${m.type === "flashcard" ? svg("layers", 18) : svg("mic", 18)}
      </div>
      <div class="flex-1 min-w-0">
        <p class="truncate text-sm font-bold text-ink-900">${m.title}</p>
        <p class="text-xs text-ink-600">${m.subtitle}</p>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-bold text-amber-500">+${m.points}</span>
        ${svg("chevronRight", 16)}
      </div>
    </button>`).join("");

  try {
    scroll.innerHTML = `
    <div class="flex items-center justify-between px-5 pt-6 pb-3">
      <div>
        <p class="text-sm font-medium text-ink-600">${getGreeting()},</p>
        <h1 class="text-xl font-extrabold text-ink-900">${firstName} 👋</h1>
      </div>
      <button data-act="progress" class="flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1.5">
        ${svg("flame", 16)}
        <span class="text-sm font-bold text-accent-500">${store.progress.streak > 0 ? store.progress.streak : "Start"}</span>
      </button>
    </div>
    ${store.feedback.helpful === "ask" || store.feedback.helpful === "thanks" ? `<div class="px-5"><div class="rounded-2xl bg-surface-0 p-4 shadow-soft">${helpfulPromptHtml()}</div></div>` : ""}
    ${hero}
    <div class="mt-5 grid grid-cols-2 gap-3 px-5">
      <button data-act="start-mission" data-id="${MISSIONS[0].id}" class="flex flex-col gap-2 rounded-2xl bg-surface-0 p-4 text-left shadow-soft transition-transform active:scale-95">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">${svg("mic", 20)}</div>
        <div><p class="text-sm font-bold text-ink-900">Free practice</p><p class="text-xs text-ink-600">Answer any prompt</p></div>
      </button>
      <button data-act="flashcards" class="flex flex-col gap-2 rounded-2xl bg-surface-0 p-4 text-left shadow-soft transition-transform active:scale-95">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/10 text-success-500">${svg("layers", 20)}</div>
        <div><p class="text-sm font-bold text-ink-900">Flashcards</p><p class="text-xs text-ink-600">Learn new words</p></div>
      </button>
    </div>
    <div class="mt-5 px-5">
      <div class="flex items-center gap-4 rounded-2xl bg-surface-0 p-4 shadow-soft">
        <div class="relative inline-flex items-center justify-center">
          <svg width="${size}" height="${size}" class="-rotate-90">
            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="currentColor" stroke-width="${stroke}" class="text-ink-100"></circle>
            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" class="text-brand-500 transition-all duration-700 ease-out"></circle>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            ${ringLabel ? `<span class="text-base font-bold text-ink-900">${ringLabel}</span>` : ""}
            ${ringSub ? `<span class="text-[10px] font-medium text-ink-400">${ringSub}</span>` : ""}
          </div>
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold text-ink-900">Weekly progress</p>
          <p class="mt-0.5 text-xs text-ink-600">${weeklyDays > 0 ? `${weeklyDays} of ${APP_CONFIG.weeklyGoalDays} days this week` : "No sessions yet this week"}</p>
          <p class="mt-1 text-xs font-medium text-brand-500">${weeklyPct >= 100 ? "Goal reached!" : weeklyDays === 0 ? `Practise ${APP_CONFIG.weeklyGoalDays} days to finish week 1` : `${APP_CONFIG.weeklyGoalDays - weeklyDays} days to go`}</p>
        </div>
      </div>
    </div>
    <div class="mt-5 px-5">
      <button data-act="feedback-log" class="flex w-full items-center gap-3 rounded-2xl bg-surface-0 p-4 text-left shadow-soft transition-transform active:scale-[0.98]">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">${svg("message", 20)}</div>
        <div class="flex-1"><p class="text-sm font-bold text-ink-900">Daily Report</p><p class="text-xs text-ink-600">Read what you said and how to improve</p></div>
        ${svg("chevronRight", 18)}
      </button>
    </div>
    <div class="mt-6 px-5">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-bold text-ink-900">More to explore</h3>
        ${course ? `<button data-act="course-plan" class="text-xs font-medium text-brand-500">Course plan</button>` : ""}
      </div>
      <div class="space-y-2.5">${missionsHtml}</div>
      ${isLocalTestHost() ? `<button type="button" data-act="next-day-test" class="mt-3 w-full py-1.5 text-center text-xs font-medium text-ink-400 hover:text-ink-600">→ Next day (test)</button>` : ""}
    </div>
    <div class="mt-6 px-5">
      <div class="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3">
        ${svg("shield", 16)}
        <p class="text-xs leading-relaxed text-ink-600">🔒 Private. Nobody else can hear you.</p>
      </div>
      ${reportFooterHtml()}
    </div>`;
  } catch (err) {
    console.error(err);
    scroll.innerHTML = `<div class="px-5 pt-10">
      <h1 class="text-xl font-extrabold text-ink-900">Welcome back</h1>
      <p class="mt-2 text-sm text-ink-600">Home couldn't load just now. Start a lesson from Practice.</p>
    </div>`;
  }
}

export function renderTour() {
  const current = ONBOARDING_TOUR[store.tourStep] || ONBOARDING_TOUR[0];
  if (!current) return;
  const iconName = { home: "home", mic: "mic", feedback: "feedback", trophy: "trophy" }[current.icon] || "home";
  $("tour-icon").innerHTML = svg(iconName, 44);
  $("tour-title").textContent = current.title;
  $("tour-body").textContent = current.body;
  $("tour-dots").innerHTML = ONBOARDING_TOUR.map((_, i) =>
    `<div class="h-1.5 rounded-full transition-all duration-300 ${i === store.tourStep ? "w-8 bg-brand-500" : i < store.tourStep ? "w-4 bg-brand-300" : "w-1.5 bg-ink-200"}"></div>`
  ).join("");
  $("tour-next").textContent = store.tourStep < ONBOARDING_TOUR.length - 1 ? "Next" : "Start practising";
  $("tour-skip").classList.toggle("hidden", store.tourStep >= ONBOARDING_TOUR.length - 1);
}

export function renderCourseChooser() {
  const list = [
    { id: "interview", name: COURSES.interview.name, tagline: COURSES.interview.tagline, price: "₹99/month", icon: "target" },
    { id: "combined", name: COURSES.combined.name, tagline: COURSES.combined.tagline, price: "₹149/month", icon: "rocket", popular: true },
    { id: "conversation", name: COURSES.conversation.name, tagline: COURSES.conversation.tagline, price: "₹99/month", icon: "messageCircle" },
  ];
  $("course-list").innerHTML = list.map((c) => {
    const isSelected = store.selectedCourseId === c.id;
    return `<button data-act="pick-course" data-id="${c.id}" class="relative flex w-full items-center gap-4 rounded-2xl text-left transition-all active:scale-[0.98] ${c.popular ? "p-5" : "p-4"} ${isSelected ? (c.popular ? "bg-accent-500/8 ring-2 ring-accent-400 shadow-card" : "bg-brand-500/10 ring-2 ring-brand-400 shadow-soft") : "bg-surface-0 shadow-soft hover:bg-surface-2"}">
      ${c.popular ? `<span class="absolute -top-2.5 right-4 rounded-full bg-accent-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">Most popular</span>` : ""}
      <div class="flex shrink-0 items-center justify-center rounded-xl ${c.popular ? "h-12 w-12" : "h-10 w-10"} ${isSelected ? (c.popular ? "bg-accent-500/15 text-accent-500" : "bg-brand-500/15 text-brand-500") : "bg-ink-100 text-ink-500"}">${svg(c.icon, c.popular ? 24 : 20)}</div>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-ink-900 ${c.popular ? "text-base" : "text-sm"}">${c.name}</p>
        <p class="mt-0.5 text-xs text-ink-600">${c.tagline}</p>
        <p class="mt-1 text-xs font-semibold ${isSelected ? (c.popular ? "text-accent-500" : "text-brand-500") : "text-ink-600"}">${c.price}</p>
      </div>
      ${isSelected ? `<div class="flex h-6 w-6 items-center justify-center rounded-full text-white animate-scale-in ${c.popular ? "bg-accent-500" : "bg-brand-500"}">${svg("check", 14)}</div>` : ""}
    </button>`;
  }).join("");
}

export function renderCoursePlan() {
  const course = COURSES[store.auth.user.courseId];
  const pct = Math.round((store.progress.completedDays.length / 30) * 100);
  $("courseplan-title").textContent = `${course.emoji} ${course.name}`;
  $("courseplan-sub").innerHTML = `Day ${store.progress.courseDay} of 30 · ${pct}% complete`;
  $("courseplan-bar").style.width = `${pct}%`;
  $("courseplan-weeks").innerHTML = course.weeks.map((week) => {
    const doneCount = week.days.filter((d) => store.progress.completedDays.includes(d.day)).length;
    const allDone = doneCount === week.days.length;
    const expanded = store.coursePlanExpanded === week.week;
    const days = expanded ? week.days.map((day) => {
      const done = store.progress.completedDays.includes(day.day);
      const isCurrent = day.day === store.progress.courseDay;
      const isMock = MOCK_DAYS.includes(day.day);
      const locked = isDayLocked(day.day);
      const score = store.progress.dayScores[day.day];
      return `<button data-act="plan-day" data-day="${day.day}" data-locked="${locked}" data-done="${done}" data-current="${isCurrent}" ${!done && !isCurrent && !locked ? "disabled" : ""} class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${isCurrent && !done ? "bg-brand-50/60" : "hover:bg-surface-2 disabled:opacity-50"}">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-success-500/15 text-success-500" : isCurrent ? "bg-brand-500 text-white" : locked ? "bg-ink-100 text-ink-400" : "bg-ink-100 text-ink-500"}">
          ${done ? svg("check", 14) : locked ? svg("lock", 12) : day.day}
        </div>
        <div class="flex-1 min-w-0">
          <p class="truncate text-sm font-medium ${done || isCurrent ? "text-ink-900" : "text-ink-600"}">${day.title}${isMock ? `<span class="ml-1.5 text-xs text-amber-500">Mock</span>` : ""}</p>
          ${score !== undefined ? `<div class="flex items-center gap-1 mt-0.5">${svg("star", 10)}<span class="text-xs text-ink-400">${score}/100</span></div>` : ""}
        </div>
        ${isCurrent && !done ? `<div class="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white shadow-popAccent">${svg("play", 14)}</div>` : ""}
        ${locked ? `<span class="text-xs font-semibold text-brand-500">Pro</span>` : ""}
      </button>`;
    }).join("") : "";
    return `<div class="rounded-2xl bg-surface-0 shadow-soft overflow-hidden">
      <button data-act="toggle-week" data-week="${week.week}" class="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-2">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${allDone ? "bg-success-500/15 text-success-500" : "bg-brand-500/10 text-brand-500"}">${allDone ? svg("check", 20) : `W${week.week}`}</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-ink-900">${week.title}</p>
          <p class="text-xs text-ink-400">${doneCount}/${week.days.length} days done</p>
        </div>
        <span class="text-ink-300 transition-transform ${expanded ? "rotate-180" : ""}">${svg("chevronDown", 18)}</span>
      </button>
      ${expanded ? `<div class="border-t border-ink-100 divide-y divide-ink-100">${days}</div>` : ""}
    </div>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function helpfulPromptHtml() {
  if (store.feedback.helpful === "thanks") {
    return `<p class="text-sm font-semibold text-success-500">Thanks!</p>`;
  }
  if (store.feedback.helpful !== "ask") return "";
  return `<div class="flex items-center justify-between gap-3">
    <p class="text-sm text-ink-600">Was today's feedback helpful?</p>
    <div class="flex shrink-0 gap-2">
      <button type="button" data-act="helpful" data-rating="1" class="tap-target flex h-10 w-10 items-center justify-center rounded-xl bg-surface-1 text-lg shadow-soft transition-transform active:scale-95">👍</button>
      <button type="button" data-act="helpful" data-rating="0" class="tap-target flex h-10 w-10 items-center justify-center rounded-xl bg-surface-1 text-lg shadow-soft transition-transform active:scale-95">👎</button>
    </div>
  </div>`;
}

export function reportFooterHtml() {
  if (store.feedback.reportOpen) {
    return `<div class="mt-4 rounded-2xl bg-surface-0 p-4 shadow-soft">
      <p class="text-sm font-bold text-ink-900">Report a problem</p>
      <textarea id="report-text" rows="3" placeholder="What went wrong?" class="mt-2 w-full resize-none rounded-xl border border-ink-200 bg-surface-1 px-3 py-2 text-sm text-ink-800 outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-50">${escapeHtml(store.feedback.reportText)}</textarea>
      <button type="button" data-act="report-send" class="mt-2 tap-target inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-pop hover:bg-brand-600 active:scale-[0.98]">Send</button>
    </div>`;
  }
  return `<p class="mt-4 text-center"><button type="button" data-act="report-open" class="text-xs font-medium text-ink-400 hover:text-ink-600">Report a problem</button></p>`;
}

export async function renderProgress() {
  const body = $("progress-body");
  if (!body) return;
  body.innerHTML = `
    <div class="rounded-2xl bg-surface-0 p-4 shadow-soft">
      <p class="text-sm text-ink-500">Loading your progress…</p>
    </div>`;

  const { data } = await loadMyProgress(store.auth.user?.courseId);
  if (store.overlay !== "progress") return;

  const streakDays = data?.streakDays || store.progress.streak || 0;
  const totalPoints = data?.totalPoints || store.progress.points || 0;
  const completed = new Set(
    (data?.completedDays?.length ? data.completedDays : store.progress.completedDays) ?? [],
  );
  const transcript = data?.day1Transcript || "";
  const course = store.auth.user?.courseId ? COURSES[store.auth.user.courseId] : null;

  const todayDay = data?.courseDay ?? store.progress.courseDay ?? 1;
  const cells = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const done = completed.has(day);
    const isToday = day === todayDay && !done;
    const mark = done
      ? "bg-accent-500"
      : isToday
        ? "border-2 border-accent-500 bg-surface-0"
        : "bg-ink-200";
    return `<div class="flex flex-col items-center">
      <div class="shrink-0 rounded-full ${mark}" style="width:40px;height:40px"></div>
      <span class="text-xs font-medium text-ink-400" style="margin-top:2px;font-size:10px;line-height:1">${day}</span>
    </div>`;
  }).join("");

  body.innerHTML = `
    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-2xl bg-surface-0 p-4 shadow-soft">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">${svg("flame", 20)}</div>
        <p class="mt-3 text-2xl font-extrabold text-ink-900">${streakDays}</p>
        <p class="mt-0.5 text-xs font-medium text-ink-500">Day streak</p>
      </div>
      <div class="rounded-2xl bg-surface-0 p-4 shadow-soft">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">${svg("star", 20)}</div>
        <p class="mt-3 text-2xl font-extrabold text-ink-900">${totalPoints}</p>
        <p class="mt-0.5 text-xs font-medium text-ink-500">Total points</p>
      </div>
    </div>
    <div class="mt-4 rounded-2xl bg-surface-0 p-4 shadow-soft">
      <p class="text-sm font-bold text-ink-900">${course ? `${course.emoji} ${course.name}` : "Your course"}</p>
      <p class="mt-0.5 text-xs text-ink-500">${completed.size} of 30 days practised</p>
      <div class="mt-3" style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px">${cells}</div>
    </div>
    ${transcript ? `
    <div class="mt-4 rounded-2xl bg-surface-0 p-4 shadow-soft">
      <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Your Day 1 answer</p>
      <p class="text-sm italic leading-relaxed text-ink-600">&ldquo;${escapeHtml(transcript)}&rdquo;</p>
    </div>` : ""}`;
}

export function renderPlans() {
  const currentPlan = store.auth.user.plan;
  const features = [
    { label: "Week 1 (7 days)", free: true, pro: true },
    { label: "Full 30-day course", free: false, pro: true },
    { label: "All course types", free: false, pro: true },
    { label: "Detailed feedback", free: true, pro: true },
    { label: "Streak & badges", free: true, pro: true },
    { label: "Priority support", free: false, pro: true },
  ];
  $("plans-body").innerHTML = `
    <div class="rounded-2xl border-2 p-5 transition-all ${currentPlan === "free" ? "border-brand-400 bg-brand-50/40 shadow-soft" : "border-ink-200 bg-surface-0"}">
      <div class="flex items-baseline gap-2"><span class="text-2xl font-extrabold text-ink-900">Free</span><span class="text-sm text-ink-500">forever</span></div>
      <p class="mt-1 text-sm text-ink-500">Week 1 of any course, full feedback.</p>
      ${currentPlan === "free" ? `<div class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500">${svg("check", 12)} Current plan</div>` : ""}
    </div>
    <div class="rounded-2xl border-2 p-5 transition-all ${currentPlan === "pro" ? "border-brand-400 bg-brand-50/40 shadow-soft" : "border-ink-200 bg-surface-0"}">
      <div class="flex items-center gap-2"><span class="rounded-md bg-accent-500/15 px-2 py-0.5 text-xs font-bold text-accent-500">MOST POPULAR</span></div>
      <div class="mt-2 flex items-baseline gap-1"><span class="text-3xl font-extrabold text-ink-900">$4.99</span><span class="text-sm text-ink-500">/month</span></div>
      <p class="mt-1 text-sm text-ink-500">Full 30-day course. Switch courses anytime.</p>
      ${currentPlan === "pro"
        ? `<div class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500">${svg("check", 12)} Current plan</div>`
        : `<button data-act="select-pro" class="tap-target inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 bg-brand-500 text-white shadow-pop hover:bg-brand-600 active:scale-[0.98] w-full mt-4">Upgrade to Pro ${svg("chevronRight", 16)}</button>`}
    </div>
    <div class="rounded-2xl bg-surface-0 p-4 shadow-soft">
      <p class="mb-3 text-sm font-bold text-ink-900">What's included</p>
      <div class="space-y-2.5">
        ${features.map((f) => `<div class="flex items-center gap-3"><div class="w-16 flex justify-center">${f.free ? svg("check", 16).replace("<svg", `<svg class="text-success-500"`) : svg("x", 16).replace("<svg", `<svg class="text-ink-300"`)}</div><span class="flex-1 text-sm text-ink-700">${f.label}</span><div class="w-16 flex justify-center">${f.pro ? svg("check", 16).replace("<svg", `<svg class="text-success-500"`) : svg("x", 16).replace("<svg", `<svg class="text-ink-300"`)}</div></div>`).join("")}
        <div class="flex items-center gap-3 border-t border-ink-100 pt-2"><span class="w-16 text-center text-xs font-bold text-ink-500">Free</span><span class="flex-1"></span><span class="w-16 text-center text-xs font-bold text-brand-500">Pro</span></div>
      </div>
    </div>
    <p class="text-center text-xs text-ink-400">Prototype — no real charges. Tap Upgrade to unlock instantly.</p>`;
}

export function renderRewards() {
  const completed = new Set((store.progress.completedDays || []).map(Number));
  const courseDays = Array.from({ length: 30 }, (_, i) => i + 1);
  const earnedBadges = BADGES.filter((b) => store.progress[b.field] >= b.threshold);
  const sortedLeaderboard = [...LEADERBOARD].sort((a, b) => b.points - a.points);
  const youEntry = sortedLeaderboard.find((e) => e.isYou);
  if (youEntry) youEntry.points = store.progress.points;
  sortedLeaderboard.sort((a, b) => b.points - a.points);
  const hasAnyBadge = earnedBadges.length > 0;
  const nextBadge = BADGES.find((b) => store.progress[b.field] < b.threshold);
  const remaining = nextBadge ? nextBadge.threshold - store.progress[nextBadge.field] : 0;
  const visibleBadges = store.showAllBadges || hasAnyBadge ? BADGES : (nextBadge ? [nextBadge] : BADGES.slice(0, 1));

  $("rewards-scroll").innerHTML = `
    <div class="px-5 pt-6 pb-3"><h1 class="text-xl font-extrabold text-ink-900">Rewards</h1></div>
    <div class="px-5">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 p-6 text-white shadow-popAccent">
        <div class="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10"></div>
        <div class="relative">
          <p class="text-xs font-semibold uppercase tracking-wide text-white/70">Total points</p>
          <div class="mt-1 flex items-baseline gap-1"><span id="points-count" class="text-4xl font-extrabold">0</span>${svg("star", 20)}</div>
          <div class="mt-3 flex items-center gap-4">
            <div class="flex items-center gap-1.5">${svg("flame", 16)}<span class="text-sm font-bold">${store.progress.streak} day streak</span></div>
            <div class="flex items-center gap-1.5">${svg("trophy", 16)}<span class="text-sm font-bold">${earnedBadges.length} badges</span></div>
          </div>
        </div>
      </div>
      ${store.feedback.helpful === "ask" || store.feedback.helpful === "thanks" ? `<div class="mt-3 rounded-2xl bg-surface-0 p-4 shadow-soft">${helpfulPromptHtml()}</div>` : ""}
    </div>
    <div class="mt-5 px-5">
      <h3 class="mb-2 text-sm font-bold text-ink-900">Streak calendar</h3>
      <div class="rounded-2xl bg-surface-0 p-4 shadow-soft">
        <div class="grid grid-cols-7 gap-1.5">${courseDays.map((d) => `<div class="flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition-all ${completed.has(d) ? "bg-accent-500 text-white" : "bg-surface-2 text-ink-300"}">${d}</div>`).join("")}</div>
        <div class="mt-3 flex items-center gap-2"><div class="flex h-4 w-4 items-center justify-center rounded bg-accent-500"></div><span class="text-xs text-ink-600">Days you practised</span></div>
      </div>
      <button data-act="feedback-log" class="mt-3 flex w-full items-center gap-3 rounded-2xl bg-surface-0 p-4 text-left shadow-soft transition-transform active:scale-[0.98]">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">${svg("message", 20)}</div>
        <div class="flex-1"><p class="text-sm font-bold text-ink-900">Daily Report</p><p class="text-xs text-ink-600">Go back and read saved notes</p></div>
        ${svg("chevronRight", 18)}
      </button>
    </div>
    <div class="mt-5 px-5">
      <h3 class="mb-2 text-sm font-bold text-ink-900">Badges</h3>
      ${!hasAnyBadge && nextBadge && !store.showAllBadges ? `<div class="mb-3 flex items-center gap-3 rounded-2xl bg-brand-50/60 p-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">${svg(nextBadge.icon === "message" ? "message" : nextBadge.icon === "flame" ? "flame" : nextBadge.icon === "book" ? "book" : nextBadge.icon === "calendar" ? "calendar" : "star", 22)}</div><div class="flex-1"><p class="text-sm font-bold text-ink-900">${nextBadge.name}</p><p class="text-xs text-ink-600">${remaining} ${remaining === 1 ? "mission" : "more"} away</p></div></div>` : ""}
      ${(hasAnyBadge || store.showAllBadges) ? `<div class="grid grid-cols-3 gap-3">${visibleBadges.map((badge) => {
        const earned = store.progress[badge.field] >= badge.threshold;
        const ic = badge.icon === "message" ? "message" : badge.icon === "flame" ? "flame" : badge.icon === "book" ? "book" : badge.icon === "calendar" ? "calendar" : "star";
        return `<div class="flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-all ${earned ? "bg-surface-0 shadow-soft" : "bg-surface-2 opacity-60"}"><div class="flex h-12 w-12 items-center justify-center rounded-full ${earned ? "bg-amber-500/15 text-amber-500" : "bg-ink-100 text-ink-300"}">${svg(ic, 22)}</div><div><p class="text-[11px] font-bold leading-tight text-ink-900">${badge.name}</p><p class="mt-0.5 text-[10px] leading-tight text-ink-600">${badge.desc}</p></div></div>`;
      }).join("")}</div>` : ""}
      ${!hasAnyBadge && !store.showAllBadges ? `<button data-act="see-badges" class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-0 py-2.5 text-xs font-medium text-ink-500 shadow-soft hover:bg-surface-2">See all badges ${svg("chevronDown", 14)}</button>` : ""}
    </div>
    <div class="mt-5 px-5">
      <button data-act="toggle-leaderboard" class="flex w-full items-center justify-between rounded-2xl bg-surface-0 p-4 shadow-soft">
        <div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">${svg("crown", 20)}</div><div class="text-left"><p class="text-sm font-bold text-ink-900">Leaderboard</p><p class="text-xs text-ink-600">${store.showLeaderboard ? "Tap to hide" : "See how you rank"}</p></div></div>
        <span class="text-ink-300 transition-transform ${store.showLeaderboard ? "rotate-90" : ""}">${svg("chevronRight", 20)}</span>
      </button>
      ${store.showLeaderboard ? `<div class="mt-2.5 space-y-2 rounded-2xl bg-surface-0 p-4 shadow-soft animate-slide-up"><p class="mb-2 text-xs font-medium text-ink-600">Ranked by practice days — never by speaking level.</p>${sortedLeaderboard.map((entry, i) => `<div class="flex items-center gap-3 rounded-xl p-2.5 ${entry.isYou ? "bg-brand-50" : ""}"><div class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-500/15 text-amber-600" : i === 1 ? "bg-ink-200 text-ink-600" : i === 2 ? "bg-accent-500/15 text-accent-600" : "bg-surface-2 text-ink-400"}">${i + 1}</div><div class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${entry.isYou ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-600"}">${entry.avatar}</div><span class="flex-1 text-sm font-bold ${entry.isYou ? "text-brand-600" : "text-ink-800"}">${entry.name}</span><span class="text-sm font-bold text-ink-600">${entry.points}</span></div>`).join("")}</div>` : ""}
    </div>
    <div class="px-5">${reportFooterHtml()}</div>`;
  countUp($("points-count"), store.progress.points, 800);
}

export function showToast(message) {
  const el = $("app-toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add("hidden"), 2800);
}

export function showDailyDigest(data) {
  const d = data || {};
  const filled = Math.max(0, Math.min(7, d.filled || 0));
  const bar = Array.from({ length: 7 }, (_, i) =>
    `<div class="h-2 flex-1 rounded-full ${i < filled ? "bg-accent-500" : "bg-ink-200"}"></div>`
  ).join("");
  const best = d.bestMoment
    ? `<div class="mt-5 rounded-2xl bg-surface-0 p-4 shadow-soft">
        <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Your best moment</p>
        <p class="text-sm italic leading-relaxed text-ink-600">&ldquo;${escapeHtml(d.bestMoment)}&rdquo;</p>
      </div>`
    : "";
  const upgrade = d.upgrade
    ? `<div class="mt-3 rounded-2xl bg-surface-0 p-4 shadow-soft">
        <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">One thing to work on</p>
        <p class="text-sm leading-relaxed text-ink-700">${escapeHtml(d.upgrade)}</p>
      </div>`
    : "";
  $("digest-scroll").innerHTML = `
    <p class="text-2xl font-extrabold text-ink-900">Day ${d.dayNumber || 1} done! 🎉</p>
    <p class="mt-1.5 text-sm text-ink-600">Great work, ${escapeHtml(d.firstName || "there")}</p>
    <div class="mt-6 grid grid-cols-3 gap-2">
      <div class="rounded-2xl bg-surface-0 p-3 text-center shadow-soft"><p class="text-xl font-extrabold text-ink-900">${d.questionsAnswered ?? 0}</p><p class="mt-1 text-[10px] font-medium leading-tight text-ink-400">Q's answered</p></div>
      <div class="rounded-2xl bg-surface-0 p-3 text-center shadow-soft"><p class="text-xl font-extrabold text-ink-900">${d.wordsLearned ?? 0}</p><p class="mt-1 text-[10px] font-medium leading-tight text-ink-400">Words learned</p></div>
      <div class="rounded-2xl bg-surface-0 p-3 text-center shadow-soft"><p class="text-xl font-extrabold text-ink-900">+${d.points ?? 0}</p><p class="mt-1 text-[10px] font-medium leading-tight text-ink-400">Pts earned</p></div>
    </div>
    ${best}
    ${upgrade}
    <div class="mt-5 rounded-2xl bg-surface-0 p-4 shadow-soft">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Your streak</p>
      <div class="flex gap-1">${bar}</div>
      <p class="mt-2 text-sm font-bold text-ink-900">Day ${filled} of 7${d.weekInProgress ? ` · ${escapeHtml(d.weekInProgress)}` : ""}</p>
      <p class="mt-0.5 text-xs text-ink-600">${escapeHtml(d.weekCaption || "")}</p>
    </div>`;
  $("digest-bottom").innerHTML = `<button data-act="digest-home" class="tap-target inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-pop hover:bg-brand-600 active:scale-[0.98]">Back to home ${svg("chevronRight", 16)}</button>`;
}

function formatFeedbackDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function renderFeedbackLog(rows, { loading = false } = {}) {
  if (loading) {
    $("feedback-log-scroll").innerHTML = `<p class="mt-8 text-center text-sm text-ink-500">Loading your feedback…</p>`;
    return;
  }
  if (!rows.length) {
    $("feedback-log-scroll").innerHTML = `<p class="mt-8 text-center text-sm text-ink-500">Finish a session to see feedback here.</p>`;
    return;
  }
  $("feedback-log-scroll").innerHTML = rows.map((row) => {
    const fb = row.ai_feedback || {};
    const prompt = row.questions?.prompt || "";
    const date = formatFeedbackDate(row.created_at);
    return `<div class="rounded-2xl bg-surface-0 p-4 shadow-soft">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-400">${escapeHtml(date)}${prompt ? ` · ${escapeHtml(prompt)}` : ""}</p>
      ${row.transcript ? `<p class="mt-2 text-sm italic leading-relaxed text-ink-600">&ldquo;${escapeHtml(row.transcript)}&rdquo;</p>` : ""}
      ${fb.praise ? `<p class="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-400">What worked</p><p class="mt-1 text-sm text-ink-700">${escapeHtml(fb.praise)}</p>` : ""}
      ${fb.one_upgrade ? `<p class="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-400">One upgrade</p><p class="mt-1 text-sm text-ink-700">${escapeHtml(fb.one_upgrade)}</p>` : ""}
      ${fb.could_have_said ? `<p class="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-400">You could have said</p><p class="mt-1 text-sm italic text-ink-700">&ldquo;${escapeHtml(fb.could_have_said)}&rdquo;</p>` : ""}
    </div>`;
  }).join("");
}

export function countUp(el, to, duration) {
  const start = performance.now();
  const tick = (now) => {
    const elapsed = now - start;
    const p = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(to * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function renderProfile() {
  const user = store.auth.user;
  const displayName = (user.name && user.name !== "You") ? user.name : user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1);
  const course = user.courseId ? COURSES[user.courseId] : null;
  const stats = [
    { label: "Day streak", value: store.progress.streak, icon: "flame", color: "text-accent-500 bg-accent-500/10" },
    { label: "Points", value: store.progress.points, icon: "trending", color: "text-amber-500 bg-amber-500/10" },
    { label: "Missions", value: store.progress.missionsCompleted, icon: "mic", color: "text-brand-500 bg-brand-500/10" },
    { label: "Words learned", value: store.progress.flashcardsLearned, icon: "book", color: "text-success-500 bg-success-500/10" },
  ];
  $("profile-scroll").innerHTML = `
    <div class="flex items-center justify-between px-5 pt-6 pb-3">
      <h1 class="text-xl font-extrabold text-ink-900">Profile</h1>
      <button data-act="settings" class="tap-target rounded-lg p-2 text-ink-400 hover:bg-surface-2">${svg("settings", 20)}</button>
    </div>
    <div class="flex flex-col items-center px-5 pt-2">
      <div class="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-extrabold text-white shadow-pop">${displayName.charAt(0).toUpperCase()}</div>
      ${store.editingName
        ? `<div class="mt-3 flex items-center gap-2"><input id="profile-name-input" value="${store.nameInput.replace(/"/g, "&quot;")}" class="rounded-lg border border-brand-300 px-3 py-1.5 text-center text-base font-bold text-ink-900 outline-none focus:ring-4 focus:ring-brand-50" /><button data-act="save-name" class="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-bold text-white">Save</button></div>`
        : `<button data-act="edit-name" class="mt-3 text-lg font-bold text-ink-900">${displayName}</button>`}
      <p class="text-sm text-ink-400">${user.email}</p>
      <div class="mt-2 flex items-center gap-2">
        <span class="rounded-full px-3 py-1 text-xs font-semibold ${user.plan === "pro" ? "bg-accent-500/15 text-accent-500" : "bg-ink-100 text-ink-500"}">${user.plan === "pro" ? "Pro" : "Free"}</span>
        <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-500">Building confidence</span>
      </div>
      ${course ? `<button data-act="change-course" class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1.5 text-sm font-medium text-brand-500"><span>${course.emoji}</span>${course.name}${svg("chevronRight", 14)}</button>` : ""}
    </div>
    ${user.courseId ? `<div class="mt-5 px-5"><div class="flex items-center gap-3 rounded-2xl bg-surface-0 p-4 shadow-soft">${svg("calendar", 20)}<div class="flex-1"><p class="text-sm font-bold text-ink-900">Day ${store.progress.courseDay} of 30</p><p class="text-xs text-ink-400">${store.progress.completedDays.length} days completed</p></div><div class="h-1.5 w-20 rounded-full bg-ink-200"><div class="h-1.5 rounded-full bg-brand-500 transition-all" style="width:${Math.round((store.progress.completedDays.length / 30) * 100)}%"></div></div></div></div>` : ""}
    <div class="mt-5 px-5">
      <h3 class="mb-2 text-sm font-bold text-ink-900">How far you've come</h3>
      ${stats.every((s) => s.value === 0)
        ? `<div class="flex items-center gap-3 rounded-2xl bg-surface-0 p-4 shadow-soft"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">${svg("mic", 20)}</div><p class="text-sm text-ink-500">Finish your first mission to start tracking progress</p></div>`
        : `<div class="grid grid-cols-2 gap-3">${stats.map((stat) => `<div class="flex items-center gap-3 rounded-2xl bg-surface-0 p-4 shadow-soft"><div class="flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}">${svg(stat.icon, 20)}</div><div><p class="text-lg font-extrabold text-ink-900">${stat.value}</p><p class="text-xs text-ink-400">${stat.label}</p></div></div>`).join("")}</div>`}
    </div>
    <div class="mt-5 px-5 space-y-2.5">
      ${PAYWALL_ENABLED ? `<button data-act="manage-plan" class="flex w-full items-center gap-3 rounded-2xl bg-surface-0 p-4 text-left shadow-soft transition-transform active:scale-[0.98]">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">${svg("crown", 20)}</div>
        <div class="flex-1"><p class="text-sm font-bold text-ink-900">${user.plan === "pro" ? "Manage plan" : "Upgrade to Pro"}</p><p class="text-xs text-ink-400">${user.plan === "pro" ? "You're on the Pro plan" : "Unlock the full 30-day course"}</p></div>${svg("chevronRight", 18)}
      </button>` : ""}
      <button data-act="logout" class="flex w-full items-center gap-3 rounded-2xl bg-surface-0 p-4 text-left shadow-soft">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">${svg("logout", 20)}</div>
        <div class="flex-1"><p class="text-sm font-bold text-ink-900">Log out</p><p class="text-xs text-ink-400">You can come back anytime</p></div>
      </button>
    </div>
    <div class="px-5 pb-2">${reportFooterHtml()}</div>
    <p class="mt-2 text-center text-xs text-ink-300">Byo<span class="text-accent-500 font-bold">U</span> v0.2 · Prototype</p>`;
}
export function spawnConfetti(container) {
  const COLORS = ["#0A61E4", "#16A87A", "#F5A623", "#F4553E", "#5B98FF"];
  container.innerHTML = "";
  for (let i = 0; i < 24; i++) {
    const d = document.createElement("div");
    d.className = "absolute top-0 h-2 w-2 rounded-sm";
    d.style.left = `${Math.random() * 100}%`;
    d.style.backgroundColor = COLORS[i % COLORS.length];
    d.style.transform = `rotate(${Math.random() * 360}deg)`;
    d.style.animation = `confettiFall 1s ease-out ${Math.random() * 0.3}s forwards`;
    container.appendChild(d);
  }
  setTimeout(() => { container.innerHTML = ""; }, 1300);
}
export function patchLiveTranscript() {
  const el = $("practice-live-text");
  if (!el) return false;
  const combined = [store.practice.transcript, store.practice.liveText].filter(Boolean).join(" ");
  el.textContent = combined
    || (store.practice.hearingVoice ? "Hearing you…" : store.practice.micState === "listening" ? "Listening… speak, then tap the mic to stop." : "");
  return true;
}

export function patchRecordingTimer() {
  const el = $("practice-rec-time");
  if (!el) return false;
  el.textContent = formatTime(store.practice.elapsedSec);
  return true;
}

export function renderPractice() {
  if (store.practice.micState === "listening" && $("practice-live-text")) {
    patchLiveTranscript();
    patchRecordingTimer();
    return;
  }

  const questions = practiceQuestions();
  if (!questions.length) {
    $("practice-dots").innerHTML = "";
    $("practice-scroll").innerHTML = `<p class="mt-8 text-center text-sm text-ink-500">Loading today's questions…</p>`;
    return;
  }
  const prompt = questions[store.practice.promptIdx % questions.length];
  const totalPrompts = questions.length;
  const isRecording = store.practice.micState === "listening";
  const hasAnyText = store.practice.transcript || store.practice.liveText;

  $("practice-dots").innerHTML = Array.from({ length: totalPrompts }).map((_, i) =>
    `<div class="h-1.5 rounded-full transition-all duration-300 ${i < store.practice.promptIdx ? "w-6 bg-brand-500" : i === store.practice.promptIdx ? "w-6 bg-brand-300" : "w-1.5 bg-ink-200"}"></div>`
  ).join("");

  const moodEl = $("practice-mood");
  if (store.practice.showMood) {
    moodEl.classList.remove("hidden");
    moodEl.classList.add("flex");
    const helpful = store.feedback.helpful;
    const summaryHead = `
      <div class="flex h-20 w-20 items-center justify-center rounded-full bg-success-500/10 text-success-500 animate-scale-in">${svg("check", 40)}</div>
      <h2 class="mt-6 text-xl font-extrabold text-ink-900">You practised out loud today</h2>
      <p class="mt-2 text-sm font-semibold text-success-500">+${(store.practice.completedCount + 1) * 20} points</p>`;
    if (helpful === "ask" || helpful === "thanks") {
      moodEl.innerHTML = `
        ${summaryHead}
        <div class="mt-8 w-full max-w-[280px] rounded-2xl bg-surface-1 p-4 shadow-soft">${helpfulPromptHtml()}</div>`;
    } else {
      moodEl.innerHTML = `
        ${summaryHead}
        <p class="mt-1 text-sm text-ink-500">How did that feel?</p>
        <div class="mt-6 grid grid-cols-2 gap-3 w-full max-w-[260px]">
          ${MOOD_OPTIONS.map((mood) => `<button data-act="mood" data-id="${mood.id}" class="flex flex-col items-center gap-1 rounded-2xl bg-surface-1 py-4 shadow-soft transition-all active:scale-95 hover:bg-surface-2"><span class="text-2xl">${mood.emoji}</span><span class="text-sm font-medium text-ink-700">${mood.label}</span></button>`).join("")}
        </div>`;
    }
    if (!helpful) spawnConfetti($("practice-confetti"));
    $("practice-bottom").classList.add("hidden");
    return;
  }
  moodEl.classList.add("hidden");
  moodEl.classList.remove("flex");

  let live = "";
  if (!store.practice.feedback) {
    live = `<div class="mt-4 ml-11 rounded-2xl bg-surface-0 px-4 py-4 shadow-soft min-h-[100px] animate-fade-in">`;
    if (isRecording) {
      live += `<div class="mb-3 flex items-center justify-between"><div class="flex items-center gap-1.5"><div class="flex items-center gap-0.5 h-5">${[0,1,2,3,4].map((i) => `<span class="w-1 rounded-full bg-accent-500 animate-wave" style="animation-delay:${i * 100}ms;height:100%"></span>`).join("")}</div><span class="ml-1.5 text-xs font-semibold text-accent-500">Recording</span></div><span id="practice-rec-time" class="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-mono font-semibold text-ink-600">${formatTime(store.practice.elapsedSec)}</span></div>`;
    }
    if (hasAnyText || isRecording) {
      live += `<p class="text-sm leading-relaxed text-ink-700"><span id="practice-live-text"></span>${isRecording ? `<span class="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-brand-500 align-middle"></span>` : ""}</p>`;
    } else if (store.practice.micState === "processing") {
      live += `<div class="flex items-center gap-2"><div class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-ink-300 animate-bounce" style="animation-delay:0ms"></span><span class="h-2 w-2 rounded-full bg-ink-300 animate-bounce" style="animation-delay:120ms"></span><span class="h-2 w-2 rounded-full bg-ink-300 animate-bounce" style="animation-delay:240ms"></span></div><span class="text-xs text-ink-400">Coach is thinking...</span></div>`;
    } else {
      live += `<p class="text-sm text-ink-400 italic">${store.practice.micState === "listening" ? "Speak now — I'll write your words when you tap stop." : "Your words will appear here as you speak."}</p>`;
    }
    live += `</div>`;
  }

  let fb = "";
  if (store.practice.feedback) {
    fb = `<div class="mt-5 space-y-3 animate-slide-up">
      <div class="rounded-2xl bg-success-500/8 p-4 shadow-soft"><div class="flex items-center gap-2"><div class="flex h-7 w-7 items-center justify-center rounded-lg bg-success-500/15 text-success-600">${svg("check", 16)}</div><p class="text-sm font-bold text-ink-900">What worked</p></div><p class="mt-2 text-sm leading-relaxed text-ink-700">${store.practice.feedback[0].body}</p></div>
      <div class="rounded-2xl bg-amber-500/8 p-4 shadow-soft"><div class="flex items-center gap-2"><div class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">${svg("trending", 16)}</div><p class="text-sm font-bold text-ink-900">One upgrade</p></div><p class="mt-2 text-sm leading-relaxed text-ink-700">${store.practice.feedback[1].body}</p></div>
      <div class="rounded-2xl bg-brand-500/8 p-4 shadow-soft"><div class="flex items-center gap-2"><div class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500">${svg("message", 16)}</div><p class="text-sm font-bold text-ink-900">You could have said</p></div><p class="mt-2 text-sm italic leading-relaxed text-ink-800">&ldquo;${escapeHtml(store.practice.feedback[2].body)}&rdquo;</p>
        <button data-act="say-rewrite" class="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-500 transition-transform active:scale-95">${svg("volume", 15)} Hear it</button>
      </div>
      <div class="rounded-2xl bg-surface-0 p-4 shadow-soft"><div class="flex items-center gap-2"><div class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500">${svg("repeat", 16)}</div><p class="text-sm font-bold text-ink-900">${store.practice.sttEngine === "typed" || store.practice.typingMode ? "Try saying this out loud" : "Say it once more"}</p></div><p class="mt-2 text-sm leading-relaxed text-ink-600">${store.practice.feedback[3].body}</p>
        ${store.practice.sttEngine === "typed" || store.practice.typingMode ? "" : `<button data-act="rerecord" class="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-accent-500/10 px-3 py-2 text-sm font-medium text-accent-500 transition-transform active:scale-95">${svg("rotate", 15)} Re-record (10s)</button>`}
      </div>
      ${store.practice.transcript ? `<div class="rounded-2xl bg-surface-0 p-4 shadow-soft"><p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">You said</p><p class="text-sm italic leading-relaxed text-ink-600">&ldquo;${store.practice.transcript}&rdquo;</p></div>` : ""}
    </div>`;
  }

  $("practice-scroll").innerHTML = `
    <div class="flex gap-2.5 animate-fade-in">
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">B</div>
      <div class="flex-1 rounded-2xl rounded-tl-md bg-surface-0 px-4 py-3 shadow-soft">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-400">${store.practice.dayNum ? `Day ${store.practice.dayNum}` : "Practice"}</p>
        <p class="mt-1 text-sm font-medium leading-relaxed text-ink-800">${prompt.text}</p>
        <button data-act="replay" class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-500">${svg("volume", 13)} Replay</button>
      </div>
    </div>
    ${store.practice.showHint ? `<div class="mt-3 ml-11 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 animate-slide-up">${svg("lightbulb", 16)}<p class="text-xs leading-relaxed text-ink-600">${prompt.hint}</p></div>` : ""}
    ${live}${fb}`;
  if (isRecording || hasAnyText) patchLiveTranscript();

  const bottom = $("practice-bottom");
  if (store.practice.feedback) {
    bottom.classList.remove("hidden");
    bottom.innerHTML = `<button data-act="next-prompt" class="tap-target inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-pop hover:bg-brand-600 active:scale-[0.98]">${store.practice.promptIdx < totalPrompts - 1 ? "Next question" : "See your results"} ${svg("chevronRight", 16)}</button>`;
    return;
  }
  if (!store.practice.showMood) {
    bottom.classList.remove("hidden");
    let inner = "";
    if (!store.practice.showHint && !hasAnyText && store.practice.micState === "idle" && !store.practice.typingMode) {
      inner += `<button data-act="hint" class="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500">${svg("lightbulb", 14)} Need a hint?</button>`;
    }
    if (store.practice.typingMode) {
      inner += `<div class="space-y-3"><div class="flex gap-2"><input id="typed-answer" type="text" value="${store.practice.typedText.replace(/"/g, "&quot;")}" placeholder="Type your answer here..." class="flex-1 rounded-xl border border-ink-200 bg-surface-1 px-4 py-3 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-50" /><button data-act="typed-send" class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white shadow-popAccent transition-all active:scale-95 disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none">${svg("send", 20)}</button></div><button data-act="switch-mic" class="mx-auto flex items-center gap-1.5 text-xs font-medium text-ink-400">${svg("mic", 13)} Switch to mic</button></div>`;
    } else {
      inner += `<div><div class="flex items-center justify-center mb-4"><div class="relative">${store.practice.micState === "listening" ? `<div class="absolute inset-0 rounded-full bg-accent-500/30 animate-pulse-ring"></div><div class="absolute inset-0 rounded-full bg-accent-500/20 animate-pulse-ring" style="animation-delay:0.5s"></div>` : ""}<button data-act="mic" ${store.practice.micState === "processing" ? "disabled" : ""} style="touch-action:manipulation" class="relative flex h-24 w-24 items-center justify-center rounded-full shadow-popAccent transition-all active:scale-95 ${store.practice.micState === "processing" ? "bg-ink-200 text-ink-400" : "bg-accent-500 text-white"}">${store.practice.micState === "processing" ? `<div class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-full bg-ink-400 animate-bounce"></span><span class="h-2.5 w-2.5 rounded-full bg-ink-400 animate-bounce" style="animation-delay:120ms"></span><span class="h-2.5 w-2.5 rounded-full bg-ink-400 animate-bounce" style="animation-delay:240ms"></span></div>` : store.practice.micState === "listening" ? `<div class="flex items-center gap-1 h-8">${[0,1,2,3,4].map((i) => `<span class="w-1 rounded-full bg-white animate-wave" style="animation-delay:${i * 120}ms;height:100%"></span>`).join("")}</div>` : svg("mic", 32)}</button></div></div>
        <p class="text-center text-sm font-semibold text-ink-600">${store.practice.micState === "idle" ? "Tap and answer out loud" : store.practice.micState === "listening" ? "I'm listening... tap to stop" : "Coach is thinking..."}</p>
        ${store.practice.sttFailed && store.practice.micState === "idle" ? `<p class="mt-2 text-center text-xs text-amber-600">Couldn't catch that. Tap the mic and try again, a little closer.</p>` : ""}
        ${store.practice.micState === "idle" ? `<button data-act="type-instead" class="mt-3 mx-auto flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-600">${svg("keyboard", 13)} Type instead</button>` : ""}</div>`;
    }
    bottom.innerHTML = inner;
    const typed = $("typed-answer");
    if (typed) {
      typed.focus();
      typed.addEventListener("input", (e) => { store.practice.typedText = e.target.value; });
      typed.addEventListener("keydown", (e) => { if (e.key === "Enter") handleTypedSubmit(); });
    }
  } else {
    bottom.classList.add("hidden");
  }
}
export function flashDeck() {
  return Array.isArray(store.flash.cards) ? store.flash.cards : [];
}
export function dismissFlashNudge({ render = true } = {}) {
  if (!store.flash.nudge) return;
  store.flash.nudge = false;
  if (render) renderFlashcard();
}

function flashWordId(card) {
  return card?.word_id ?? card?.id ?? null;
}

let flashListenTimer = null;
let flashAdvanceTimer = null;
let flashDrillGen = 0;
let flashSpoken = "";
let flashInterim = "";

function clearFlashDrillTimers() {
  if (flashListenTimer) { clearTimeout(flashListenTimer); flashListenTimer = null; }
  if (flashAdvanceTimer) { clearTimeout(flashAdvanceTimer); flashAdvanceTimer = null; }
}

export function resetFlashDrill() {
  flashDrillGen += 1;
  clearFlashDrillTimers();
  speechController.stopListening();
  flashSpoken = "";
  flashInterim = "";
  store.flash.drill = "idle";
}

function heardTarget(transcript, word) {
  const needle = String(word || "").toLowerCase().trim();
  if (!needle) return false;
  return String(transcript || "").toLowerCase().includes(needle);
}

function finishFlashListen(gen) {
  if (gen !== flashDrillGen) return;
  speechController.stopListening();
  if (flashListenTimer) { clearTimeout(flashListenTimer); flashListenTimer = null; }
  const spoken = `${flashSpoken} ${flashInterim}`.trim();
  const word = flashDeck()[store.flash.idx]?.word;
  if (heardTarget(spoken, word)) {
    store.flash.drill = "got_it";
    renderFlashcard();
    flashAdvanceTimer = setTimeout(() => {
      if (gen !== flashDrillGen) return;
      resetFlashDrill();
      handleSwipe("right");
    }, 1500);
    return;
  }
  store.flash.drill = "try_again";
  renderFlashcard();
}

export function startFlashListen() {
  const gen = ++flashDrillGen;
  clearFlashDrillTimers();
  speechController.stopListening();
  flashSpoken = "";
  flashInterim = "";
  store.flash.flipped = false;
  store.flash.drill = "listen";
  renderFlashcard();

  if (!speechController.isSpeechRecognitionSupported()) {
    store.flash.drill = "try_again";
    renderFlashcard();
    return;
  }

  speechController.startListening(
    (result) => {
      if (gen !== flashDrillGen) return;
      if (result.isFinal) flashSpoken += `${result.transcript || ""} `;
      else flashInterim = result.transcript || "";
    },
    (err) => {
      if (gen !== flashDrillGen) return;
      if (err === "aborted") return;
      finishFlashListen(gen);
    },
    () => {},
  );

  flashListenTimer = setTimeout(() => finishFlashListen(gen), 4000);
}

export async function loadFlashDeck() {
  resetFlashIfNewDay();
  const retry = [...(store.flash.retry || [])];
  store.flash.retry = [];
  const shown = new Set((store.flash.shownIds || []).map(String));
  const seen = new Set([...shown, ...retry.map(flashWordId)].filter(Boolean).map(String));
  const need = Math.max(0, FLASH_SET_SIZE - retry.length);
  let fresh = [];
  store.flash.loadError = null;
  if (need > 0) {
    const due = await getDueWords(need, [...seen]);
    if (due.error) {
      console.error(due.error);
      store.flash.loadError = due.error.message || "Could not load words";
      store.flash.retry = retry;
      store.flash.cards = retry;
      return retry;
    }
    fresh = shuffleWords((due.data ?? []).filter((card) => !seen.has(String(flashWordId(card)))));
  }
  const cards = [...retry, ...fresh].slice(0, FLASH_SET_SIZE);
  store.flash.cards = cards;
  return cards;
}

export function renderFlashcard() {
  const deck = flashDeck();
  if (store.flash.nudge) {
    $("flashcard-main").innerHTML = `
      <div class="flex flex-1 flex-col items-center justify-center bg-surface-1 px-6 text-center">
        <div class="flex h-20 w-20 items-center justify-center rounded-full bg-accent-500/15 text-accent-500">${svg("trophy", 36)}</div>
        <h2 class="mt-6 text-xl font-extrabold text-ink-900">10 words done!</h2>
        <p class="mt-2 text-sm text-ink-500">${store.flash.spokenCount ?? store.flash.learned} words learned so far</p>
        <button type="button" data-act="flash-nudge-continue" class="tap-target mt-8 inline-flex w-full max-w-[260px] items-center justify-center gap-2 rounded-xl bg-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-popAccent transition-all hover:bg-accent-600 active:scale-[0.98]">Practice more ${svg("chevronRight", 16)}</button>
        <button type="button" data-act="claim-cards" class="tap-target mt-3 inline-flex w-full max-w-[260px] items-center justify-center rounded-xl border border-ink-200 bg-surface-0 px-5 py-3 text-sm font-semibold text-ink-700 transition-all hover:bg-surface-2 active:scale-[0.98]">Back to home</button>
      </div>`;
    return;
  }
  if (store.flash.done) {
    $("flashcard-main").innerHTML = `
      <div class="flex flex-1 flex-col items-center justify-center px-6 text-center animate-fade-in">
        <div class="flex h-20 w-20 items-center justify-center rounded-full bg-success-500/10 text-success-500 animate-scale-in">${svg("star", 36)}</div>
        <h2 class="mt-6 text-xl font-extrabold text-ink-900">All words done for today!</h2>
        <button data-act="claim-cards" class="tap-target inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 bg-brand-500 text-white shadow-pop hover:bg-brand-600 active:scale-[0.98] w-full mt-8 max-w-[260px]">Back home ${svg("chevronRight", 16)}</button>
      </div>`;
    return;
  }
  if (store.flash.loadError) {
    $("flashcard-main").innerHTML = `
      <div class="flex flex-1 flex-col items-center justify-center px-6 text-center animate-fade-in">
        <h2 class="text-xl font-extrabold text-ink-900">Couldn’t load words</h2>
        <p class="mt-2 text-sm text-ink-500">Check your connection and try again.</p>
        <button data-act="flash-reload" class="tap-target inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold bg-brand-500 text-white shadow-pop hover:bg-brand-600 active:scale-[0.98] w-full mt-8 max-w-[260px]">Try again</button>
      </div>`;
    return;
  }
  const card = deck[store.flash.idx];
  if (!card) return;
  const transform = store.flash.exitDir
    ? `translateX(${store.flash.exitDir === "right" ? 200 : -200}px) rotate(${store.flash.exitDir === "right" ? 20 : -20}deg)`
    : "translateX(0)";
  const ipa = card.ipa
    ? `<p class="text-sm font-medium tracking-wide text-ink-500">/${escapeHtml(card.ipa)}/</p>`
    : "";
  const showMarks = store.flash.drill !== "listen" && store.flash.drill !== "got_it";
  const showSay = store.flash.drill === "listen" || store.flash.drill === "try_again";
  $("flashcard-main").innerHTML = `
    <div class="flex items-center justify-between px-5 pt-5 pb-3">
      <button data-act="flash-exit" class="tap-target rounded-lg p-2 text-ink-400 hover:bg-surface-2"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
      <div class="flex items-center gap-1.5">${deck.map((_, i) => `<div class="h-1.5 rounded-full transition-all ${i === store.flash.idx ? "w-6 bg-brand-500" : i < store.flash.idx ? "w-4 bg-brand-300" : "w-1.5 bg-ink-200"}"></div>`).join("")}</div>
      <div class="w-9"></div>
    </div>
    <div class="flex flex-1 flex-col items-center justify-center px-6">
      <div class="relative w-full max-w-[300px]" style="transform:${transform};opacity:${store.flash.exitDir ? 0 : 1};transition:${store.flash.exitDir ? "all 0.25s ease-out" : "all 0.3s ease-out"}">
        <div data-act="flip-card" role="button" tabindex="0" class="relative flex min-h-72 w-full cursor-pointer flex-col items-center justify-center overflow-y-auto rounded-3xl bg-surface-0 p-6 text-center shadow-card">
          ${!store.flash.flipped
            ? `<p class="text-xs font-semibold uppercase tracking-wide text-ink-400">Word ${store.flash.idx + 1} of ${deck.length}</p><h2 class="mt-3 text-3xl font-extrabold text-ink-900">${escapeHtml(card.word)}</h2><button type="button" data-act="say-word" class="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-500">${svg("volume", 16)} Say it</button><p class="mt-4 text-xs text-ink-400">Tap to see meaning + example</p>`
            : `<div class="animate-fade-in space-y-3">
                <p class="text-sm font-bold text-ink-900">${escapeHtml(card.meaning || "")}</p>
                <p class="rounded-xl bg-surface-2 px-4 py-3 text-sm italic text-ink-600">${escapeHtml(card.example || "")}</p>
                ${ipa}
                <p class="text-xs text-ink-400">Tap to flip back</p>
              </div>`}
        </div>
      </div>
      <div class="mt-8 flex min-h-20 flex-col items-center justify-center gap-3">
        ${store.flash.drill === "got_it" ? `<p class="rounded-full bg-success-500/15 px-4 py-2 text-sm font-bold text-success-600">✓ Got it!</p>` : ""}
        ${store.flash.drill === "try_again" ? `<p class="text-sm font-semibold text-amber-500">Try once more</p>` : ""}
        ${showSay ? `<button type="button" data-act="now-say-it" class="flex flex-col items-center gap-2">
          <span class="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-pop ${store.flash.drill === "listen" ? "animate-pulse" : ""}">${svg("mic", 26)}</span>
          <span class="text-sm font-semibold text-ink-800">Now say it</span>
        </button>` : ""}
        ${showMarks ? `<div class="flex items-center gap-8">
          <button type="button" data-act="swipe-left" class="tap-target flex h-12 w-12 items-center justify-center rounded-full bg-surface-0 text-ink-400 shadow-soft transition-transform active:scale-90">${svg("x", 22)}</button>
          <button type="button" data-act="swipe-right" class="tap-target flex h-12 w-12 items-center justify-center rounded-full bg-success-500 text-white shadow-soft transition-transform active:scale-90">${svg("check", 22)}</button>
        </div>` : ""}
      </div>
      <p class="mt-4 text-xs font-medium text-ink-400">${store.flash.learned} learned</p>
    </div>`;
}

export function handleSwipe(dir) {
  const deck = flashDeck();
  const card = deck[store.flash.idx];
  const wordId = flashWordId(card);
  const finishingSet = store.flash.idx >= deck.length - 1;
  const celebrate = finishingSet && deck.length >= FLASH_SET_SIZE;
  resetFlashDrill();
  store.flash.exitDir = dir;
  if (dir === "right") store.flash.learned += 1;
  if (dir === "left" && card) store.flash.retry = [...(store.flash.retry || []), card];
  let spokenPromise = Promise.resolve();
  if (wordId) {
    const id = String(wordId);
    if (!(store.flash.shownIds || []).some((item) => String(item) === id)) {
      store.flash.shownIds = [...(store.flash.shownIds || []), id];
    }
    spokenPromise = markSpoken(wordId, dir === "right").catch(() => {});
  }
  renderFlashcard();
  setTimeout(() => {
    store.flash.exitDir = null;
    store.flash.drill = "idle";
    if (!finishingSet) {
      store.flash.idx += 1;
      store.flash.flipped = false;
      renderFlashcard();
      return;
    }
    Promise.all([spokenPromise, loadFlashDeck()]).then(async ([, cards]) => {
      if (store.overlay !== "flashcard") return;
      store.flash.flipped = false;
      if (store.flash.loadError) {
        store.flash.nudge = false;
        renderFlashcard();
        return;
      }
      if (!cards.length) {
        store.flash.done = true;
        store.flash.nudge = false;
        renderFlashcard();
        return;
      }
      store.flash.idx = 0;
      store.flash.done = false;
      store.flash.nudge = celebrate;
      if (celebrate) {
        const counted = await countSpokenWords();
        store.flash.spokenCount = counted.error ? (store.flash.learned || 0) : counted.count;
      }
      renderFlashcard();
    });
  }, 250);
}

export function openSheet(id) {
  $(`sheet-${id}`).classList.remove("hidden");
  $(`sheet-${id}`).classList.add("flex");
}
export function closeSheet(id) {
  $(`sheet-${id}`).classList.add("hidden");
  $(`sheet-${id}`).classList.remove("flex");
}

export function renderSettings() {
  $("settings-body").innerHTML = SETTINGS_OPTIONS.map((opt) => `
    <div class="flex items-center justify-between py-2">
      <span class="text-sm font-medium text-ink-800">${opt.label}</span>
      ${opt.type === "toggle"
        ? `<button data-act="toggle-notif" class="flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${store.notifEnabled ? "bg-brand-500" : "bg-ink-200"}"><div class="h-5 w-5 rounded-full bg-white shadow-soft transition-transform ${store.notifEnabled ? "translate-x-4" : ""}"></div></button>`
        : svg("chevronRight", 18)}
    </div>`).join("");
}


