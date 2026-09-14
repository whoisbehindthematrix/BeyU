import {
  store,
  ONBOARDING_TOUR,
  COURSES,
  isDayLocked,
  mondayOfWeek,
  saveDisplayName,
  markTourSeen,
  practiceQuestions,
  startPractice,
  handlePracticeComplete,
  practiceExit,
  handleFlashcardComplete,
  resetForNext,
  submitAnswer,
  handleLogout,
  handleCourseSelect,
  handleSelectPlan,
  advanceDayForTest,
  resetFlashIfNewDay,
  refreshHomeData,
  loadSavedFeedback,
  wireSession,
} from "./session.js";
import {
  speechController,
  startListening,
  stopListening,
  stopRecording,
  stopTimer,
  handleTypedSubmit,
  wireVoice,
} from "./voice.js";
import {
  $,
  route,
  renderPractice,
  patchLiveTranscript,
  patchRecordingTimer,
  spawnConfetti,
  renderTour,
  renderCourseChooser,
  renderCoursePlan,
  renderRewards,
  renderProfile,
  renderFlashcard,
  flashDeck,
  loadFlashDeck,
  startFlashListen,
  resetFlashDrill,
  dismissFlashNudge,
  renderSettings,
  renderHome,
  showToast,
  showDailyDigest,
  renderFeedbackLog,
  openSheet,
  closeSheet,
  handleSwipe,
  setOfflineBanner,
  showScreen,
  showTabNav,
} from "./ui.js";
import { signInWithGoogle, signInWithEmail, onAuthChange, loadBootState } from "./auth.js";
import { submitFeedback } from "./feedback.js";
import { track } from "./track.js";

wireSession({ stopTimer, route, renderPractice, spawnConfetti, showToast, showDailyDigest, $ });
wireVoice({ renderPractice, submitAnswer, patchLiveTranscript, patchRecordingTimer });

const PULSE_RATING = { nervous: 2, okay: 3, good: 4, great: 5 };

function openFeedbackHistory(from) {
  store.feedbackLogFrom = from || store.tab || "home";
  store.overlay = "feedbackLog";
  route();
  renderFeedbackLog([], { loading: true });
  loadSavedFeedback().then(({ data, error }) => {
    if (error) showToast("Couldn't load feedback.");
    renderFeedbackLog(data ?? []);
  }).catch((err) => {
    console.error(err);
    showToast("Couldn't load feedback.");
    renderFeedbackLog([]);
  });
}

function startFlashcards() {
  resetFlashIfNewDay();
  store.flash.idx = 0;
  store.flash.flipped = false;
  store.flash.learned = 0;
  store.flash.done = false;
  store.flash.nudge = false;
  store.flash.cards = null;
  store.flash.drill = "idle";
  store.flash.loadError = null;
  store.overlay = "flashcard";
  resetFlashDrill();
  route();
  loadFlashDeck().then((cards) => {
    if (store.overlay !== "flashcard") return;
    if (store.flash.loadError) {
      renderFlashcard();
      return;
    }
    if (!cards.length) store.flash.done = true;
    renderFlashcard();
  });
}

function sendFeedback(payload) {
  submitFeedback(payload).then(({ error }) => { if (error) console.error(error); });
}

function handleHelpful(rating) {
  sendFeedback({
    sessionId: store.practice.sessionId,
    kind: "post_session",
    rating: Number(rating),
    comment: null,
  });
  store.feedback.helpful = "thanks";
  if (store.practice.showMood) renderPractice();
  else if (store.tab === "rewards") renderRewards();
  else if (store.tab === "home") renderHome();
  setTimeout(() => {
    store.feedback.helpful = "hidden";
    if (store.practice.showMood) practiceExit();
    else if (store.tab === "rewards") renderRewards();
    else if (store.tab === "home") renderHome();
  }, 1000);
}

function handleReportOpen() {
  store.feedback.reportOpen = true;
}

function handleReportSend() {
  const comment = store.feedback.reportText.trim();
  if (!comment) return false;
  sendFeedback({
    sessionId: store.practice.sessionId,
    kind: "bug",
    rating: null,
    comment,
  });
  store.feedback.reportOpen = false;
  store.feedback.reportText = "";
  return true;
}

function advancePracticePrompt() {
  const questions = practiceQuestions();
  const totalPrompts = questions.length || 1;
  store.practice.completedCount += 1;
  if (store.practice.promptIdx < totalPrompts - 1) {
    store.practice.promptIdx += 1;
    resetForNext();
    renderPractice();
    const next = questions[store.practice.promptIdx % questions.length];
    track("question_shown", {
      q_id: store.practice.questionIds[store.practice.promptIdx] ?? next?.id ?? null,
      position: store.practice.promptIdx + 1,
    });
  } else {
    store.practice.showMood = true;
    renderPractice();
  }
}

function goHomeFromDigest(e) {
  if (!e.target.closest("[data-act=digest-home]")) return;
  refreshHomeData().catch((err) => {
    console.error(err);
    store.overlay = null;
    store.tab = "home";
    route();
  });
}

function bind() {
  $("auth-google").onclick = () => { signInWithGoogle(); };
  $("auth-email-form").onsubmit = async (e) => {
    e.preventDefault();
    const email = $("auth-email").value.trim();
    const msg = $("auth-message");
    msg.classList.remove("hidden");
    if (!email) {
      msg.textContent = "Enter your email and we'll send a link.";
      return;
    }
    const { error } = await signInWithEmail(email);
    msg.textContent = error
      ? "We couldn't send that just now. Try again in a moment."
      : "Check your inbox — the link is on its way.";
  };

  $("welcome-get-started").onclick = () => { store.authScreen = "auth"; route(); };
  $("welcome-login").onclick = () => { store.authScreen = "auth"; route(); };

  $("tour-next").onclick = () => {
    if (store.tourStep < ONBOARDING_TOUR.length - 1) { store.tourStep += 1; renderTour(); }
    else { markTourSeen().then(() => route()); }
  };
  $("tour-skip").onclick = $("tour-skip-x").onclick = () => { markTourSeen().then(() => route()); };

  $("course-start").onclick = () => handleCourseSelect(store.selectedCourseId);
  $("course-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act=pick-course]");
    if (!btn) return;
    store.selectedCourseId = btn.getAttribute("data-id");
    renderCourseChooser();
  });

  $("home-scroll").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "rewards") { store.tab = "rewards"; route(); }
    else if (act === "course-plan") {
      const idx = COURSES[store.auth.user.courseId].weeks.findIndex((w) => w.days.some((d) => d.day === store.progress.courseDay));
      store.coursePlanExpanded = idx + 1 || 1;
      store.overlay = "coursePlan";
      route();
    }
    else if (act === "flashcards") startFlashcards();
    else if (act === "start-mission") { startPractice(); }
    else if (act === "progress") { store.tab = "rewards"; store.overlay = null; route(); }
    else if (act === "start-day") {
      const day = Number(btn.getAttribute("data-day"));
      if (isDayLocked(day)) { store.overlay = "plans"; route(); return; }
      startPractice({ courseDay: day });
    }
    else if (act === "upgrade") { store.overlay = "plans"; route(); }
    else if (act === "report-open") { handleReportOpen(); renderHome(); }
    else if (act === "report-send") { if (handleReportSend()) renderHome(); }
    else if (act === "helpful") handleHelpful(btn.getAttribute("data-rating"));
    else if (act === "next-day-test") {
      advanceDayForTest()
        .then(() => {
          store.practice.courseQuestions = null;
          renderHome();
        })
        .catch((err) => console.error("advanceDayForTest failed", err));
    }
    else if (act === "feedback-log") openFeedbackHistory("home");
  });

  $("tabnav").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    const t = btn.getAttribute("data-tab");
    if (t === "practice") startPractice({ fromTab: true });
    else { store.tab = t; store.overlay = null; route(); }
  });

  $("practice-exit").onclick = () => { stopTimer(); speechController.stopListening(); stopRecording().catch(() => {}); practiceExit(); };
  $("practice-skip").onclick = () => {
    const questions = practiceQuestions();
    const totalPrompts = questions.length || 1;
    resetForNext();
    if (store.practice.promptIdx < totalPrompts - 1) {
      store.practice.promptIdx += 1;
      renderPractice();
      const prompt = questions[store.practice.promptIdx % questions.length];
      track("question_shown", {
        q_id: store.practice.questionIds[store.practice.promptIdx] ?? prompt?.id ?? null,
        position: store.practice.promptIdx + 1,
      });
    }
    else {
      handlePracticeComplete(store.practice.completedCount * 15, "");
    }
  };
  $("practice-scroll").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    const questions = practiceQuestions();
    const prompt = questions[store.practice.promptIdx % questions.length];
    if (act === "replay") speechController.speak(prompt.text);
    else if (act === "say-rewrite") {
      const rewrite = store.practice.feedback?.[2]?.body || store.practice.aiFeedback?.could_have_said || "";
      if (rewrite) speechController.speak(rewrite);
    } else if (act === "rerecord") {
      const better = store.practice.feedback[1].better || prompt.text;
      store.practice.resaying = true;
      speechController.speak(better);
      if (!store.practice.typingMode) startListening();
    } else if (act === "next-prompt") advancePracticePrompt();
  });
  $("practice-bottom").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "hint") { store.practice.showHint = true; renderPractice(); }
    else if (act === "mic") {
      if (store.practice.micState === "idle") startListening();
      else if (store.practice.micState === "listening") stopListening();
    } else if (act === "type-instead") {
      if (store.practice.micState === "listening") { speechController.stopListening(); stopTimer(); store.practice.micState = "idle"; stopRecording().catch(() => {}); }
      track("typed_fallback_used");
      store.practice.typingMode = true; renderPractice();
    } else if (act === "switch-mic") { store.practice.typingMode = false; renderPractice(); }
    else if (act === "typed-send") handleTypedSubmit();
    else if (act === "next-prompt") advancePracticePrompt();
  });
  $("practice-mood").addEventListener("click", (e) => {
    const helpfulBtn = e.target.closest("[data-act=helpful]");
    if (helpfulBtn) {
      handleHelpful(helpfulBtn.getAttribute("data-rating"));
      return;
    }
    const btn = e.target.closest("[data-act=mood]");
    if (!btn) return;
    const moodId = btn.getAttribute("data-id");
    const points = (store.practice.completedCount + 1) * 20;
    sendFeedback({
      sessionId: store.practice.sessionId,
      kind: "readiness_pulse",
      rating: PULSE_RATING[moodId] ?? null,
      comment: moodId,
    });
    handlePracticeComplete(points, moodId);
  });

  $("flashcard-main").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "flash-exit") { resetFlashDrill(); dismissFlashNudge({ render: false }); store.overlay = null; route(); }
    else if (act === "flip-card") { resetFlashDrill(); store.flash.flipped = !store.flash.flipped; renderFlashcard(); }
    else if (act === "say-word") {
      e.stopPropagation();
      const word = flashDeck()[store.flash.idx]?.word;
      if (!word) return;
      resetFlashDrill();
      store.flash.flipped = false;
      renderFlashcard();
      const goListen = () => {
        if (store.overlay !== "flashcard") return;
        startFlashListen();
      };
      speechController.speak(word, goListen);
      if (!("speechSynthesis" in window)) goListen();
    }
    else if (act === "now-say-it") {
      e.stopPropagation();
      if (store.flash.drill === "listen") return;
      startFlashListen();
    }
    else if (act === "swipe-left") handleSwipe("left");
    else if (act === "swipe-right") handleSwipe("right");
    else if (act === "claim-cards") { dismissFlashNudge({ render: false }); handleFlashcardComplete(store.flash.learned); }
    else if (act === "flash-nudge-continue") dismissFlashNudge();
    else if (act === "flash-reload") startFlashcards();
  });

  $("courseplan-back").onclick = () => { store.overlay = null; route(); };
  $("progress-back").onclick = () => { store.overlay = null; route(); };
  $("courseplan-weeks").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "toggle-week") {
      const w = Number(btn.getAttribute("data-week"));
      store.coursePlanExpanded = store.coursePlanExpanded === w ? 0 : w;
      renderCoursePlan();
    } else if (act === "plan-day") {
      const day = Number(btn.getAttribute("data-day"));
      const locked = btn.getAttribute("data-locked") === "true";
      const done = btn.getAttribute("data-done") === "true";
      const isCurrent = btn.getAttribute("data-current") === "true";
      if (locked) { store.overlay = "plans"; route(); return; }
      if (done || isCurrent) startPractice({ courseDay: day });
    }
  });

  $("plans-back").onclick = () => { store.overlay = null; route(); };
  $("plans-body").addEventListener("click", (e) => {
    if (e.target.closest("[data-act=select-pro]")) handleSelectPlan("pro");
  });

  $("rewards-scroll").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "see-badges") { store.showAllBadges = true; renderRewards(); }
    else if (act === "toggle-leaderboard") { store.showLeaderboard = !store.showLeaderboard; renderRewards(); }
    else if (act === "feedback-log") openFeedbackHistory("rewards");
    else if (act === "helpful") handleHelpful(btn.getAttribute("data-rating"));
    else if (act === "report-open") { handleReportOpen(); renderRewards(); }
    else if (act === "report-send") { if (handleReportSend()) renderRewards(); }
  });

  $("digest-scroll").addEventListener("click", goHomeFromDigest);
  $("digest-bottom").addEventListener("click", goHomeFromDigest);
  $("feedback-log-back").onclick = () => {
    store.overlay = null;
    store.tab = store.feedbackLogFrom === "rewards" ? "rewards" : "home";
    route();
  };

  $("profile-scroll").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "settings") { renderSettings(); openSheet("settings"); }
    else if (act === "change-course") { store.overlay = "courseChooser"; route(); }
    else if (act === "manage-plan") { store.overlay = "plans"; route(); }
    else if (act === "logout") handleLogout();
    else if (act === "report-open") { handleReportOpen(); renderProfile(); }
    else if (act === "report-send") { if (handleReportSend()) renderProfile(); }
    else if (act === "edit-name") {
      store.nameInput = store.auth.user.name;
      store.editingName = true;
      renderProfile();
      const inp = $("profile-name-input");
      if (inp) { inp.focus(); inp.addEventListener("input", (e) => { store.nameInput = e.target.value; }); }
    } else if (act === "save-name") {
      if (store.nameInput.trim()) {
        saveDisplayName(store.nameInput.trim()).then(() => {
          store.editingName = false;
          renderProfile();
        });
      }
    }
  });

  ["home-scroll", "rewards-scroll", "profile-scroll"].forEach((id) => {
    $(id).addEventListener("input", (e) => {
      if (e.target.id === "report-text") store.feedback.reportText = e.target.value;
    });
  });

  document.querySelectorAll("[data-sheet-close]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-sheet-close");
      closeSheet(id);
    });
  });
  $("settings-body").addEventListener("click", (e) => {
    if (e.target.closest("[data-act=toggle-notif]")) { store.notifEnabled = !store.notifEnabled; renderSettings(); }
  });

  window.addEventListener("online", () => { if (store.tab === "home" && store.auth.user) setOfflineBanner(); });
  window.addEventListener("offline", () => { if (store.tab === "home" && store.auth.user) setOfflineBanner(); });
}

bind();
track("app_open");

function oauthErrorFromUrl() {
  const params = new URLSearchParams(location.search);
  if (params.has("code")) return "";
  const raw = params.get("error_description") || params.get("error");
  if (!raw) return "";
  return decodeURIComponent(raw.replace(/\+/g, " "));
}

function pendingOAuthFromUrl() {
  return new URLSearchParams(location.search).has("code")
    || location.hash.includes("access_token");
}

function applyBoot(boot) {
  const session = boot?.session;
  const u = session?.user;
  if (!u) {
    store.auth = { user: null, rememberMe: false };
    store.progress = {
      ...store.progress,
      seenTour: false,
      streak: 0,
      points: 0,
      lastPracticeDate: null,
      courseDay: 1,
      completedDays: [],
      practiceDays: [],
      weeklyStartDay: null,
    };
    return;
  }

  const profile = boot.profile;
  const meta = u.user_metadata || {};
  const email = u.email || "";
  const fallbackName = meta.full_name || meta.name || (email ? email.split("@")[0] : "You");
  const completedDays = boot.completedDays?.length
    ? boot.completedDays
    : (boot.maxCompletedDay
      ? Array.from({ length: boot.maxCompletedDay }, (_, i) => i + 1)
      : []);
  const courseDay = boot.courseDay != null
    ? boot.courseDay
    : (boot.maxCompletedDay
      ? (boot.todayDone ? boot.maxCompletedDay : Math.min(30, boot.maxCompletedDay + 1))
      : (boot.maxDay >= 1 ? boot.maxDay : 1));

  store.auth = {
    user: {
      id: u.id,
      email,
      name: profile?.display_name || fallbackName,
      goal: "",
      createdAt: Date.parse(u.created_at) || Date.now(),
      courseId: boot.courseId ?? null,
      plan: store.auth.user?.id === u.id ? (store.auth.user.plan || "free") : "free",
    },
    rememberMe: true,
  };
  store.progress = {
    ...store.progress,
    seenTour: !!profile,
    streak: profile?.streak_days ?? 0,
    points: profile?.total_points ?? 0,
    lastPracticeDate: profile?.last_active_date ?? null,
    courseDay,
    completedDays,
    practiceDays: boot.practiceDays ?? [],
    weeklyStartDay: mondayOfWeek(store.progress.simDateOffset),
  };
}

function showOAuthError(oauthError) {
  showTabNav(false);
  showScreen("auth");
  const msg = $("auth-message");
  msg.classList.remove("hidden");
  msg.textContent = /exchange external code/i.test(oauthError)
    ? "Google sign-in failed. In Google Cloud, copy Client ID and Client secret from the Web client into Supabase → Authentication → Google. Redirect URI must be exactly https://qgotpjylwhtgutgubwfe.supabase.co/auth/v1/callback"
    : oauthError;
  history.replaceState({}, "", location.pathname);
}

async function startApp() {
  const boot = await loadBootState();
  if (!boot.session && pendingOAuthFromUrl()) return;

  applyBoot(boot);

  if (!boot.session) {
    const oauthError = oauthErrorFromUrl();
    if (oauthError) {
      showOAuthError(oauthError);
      return;
    }
    store.authScreen = store.authScreen || "welcome";
    route();
    return;
  }

  route();
}

onAuthChange((event, session) => {
  if (event === "INITIAL_SESSION") return;

  if (event === "SIGNED_OUT" || !session?.user) {
    applyBoot({ session: null, profile: null, todayDone: false, maxDay: 0, maxCompletedDay: 0, courseId: null });
    store.authScreen = "welcome";
    route();
    return;
  }

  if (event === "SIGNED_IN") {
    const provider = session.user.app_metadata?.provider
      || session.user.identities?.[0]?.provider
      || "email";
    track("login_success", { provider });
    if (pendingOAuthFromUrl()) {
      const path = location.pathname.endsWith("/") ? location.pathname : `${location.pathname}/`;
      history.replaceState({}, "", path);
    }
    loadBootState().then((boot) => {
      applyBoot(boot);
      route();
    });
  }
});

startApp();
