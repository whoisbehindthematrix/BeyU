import {
  store,
  hooks,
  APP_CONFIG,
  AUTH_COPY,
  ONBOARDING_TOUR,
  FLASHCARDS,
  COURSES,
  FREE_TIER_MAX_DAY,
  saveAuth,
  clearAuth,
  persistProgress,
  practiceQuestions,
  startPractice,
  stopTimer,
  resetForNext,
  handlePracticeComplete,
  practiceExit,
  handleFlashcardComplete,
} from "./session.js";
import {
  speechController,
  startListening,
  stopListening,
  handleTypedSubmit,
} from "./voice.js";
import {
  $,
  route,
  renderPractice,
  spawnConfetti,
  renderTour,
  renderCourseChooser,
  renderFlashcard,
  renderCoursePlan,
  renderPlans,
  renderRewards,
  renderProfile,
  renderSettings,
  renderDeleteSheet,
  updateSignupSubmit,
  setCheck,
  openSheet,
  closeSheet,
  handleSwipe,
  setOfflineBanner,
} from "./ui.js";

hooks.route = route;
hooks.renderPractice = renderPractice;
hooks.spawnPracticeConfetti = () => spawnConfetti($("practice-confetti"));

function handleSignUp() {
  const name = $("signup-name").value.trim();
  const email = $("signup-email").value.trim();
  const pw = $("signup-pw").value;
  const pwValid = pw.length >= 8;
  const canSubmit = name && email && pwValid && store.consentVoice && store.consentTerms;
  if (!canSubmit) {
    $("signup-helper").textContent = (!store.consentVoice || !store.consentTerms) ? "Please check both boxes to continue." : "Please fill in all fields.";
    $("signup-helper").classList.remove("hidden");
    return;
  }
  $("signup-helper").classList.add("hidden");
  store.pendingUser = { id: crypto.randomUUID(), email, name, goal: "", createdAt: Date.now(), courseId: null, plan: "free" };
  store.pendingEmail = email;
  store.authScreen = "otp";
  $("otp-subtitle").textContent = AUTH_COPY.otp.subtitle(email);
  $("otp-form-view").classList.remove("hidden");
  $("otp-celebrate").classList.add("hidden");
  route();
}

function handleGoogleSignUp() {
  const user = { id: crypto.randomUUID(), email: "you@gmail.com", name: "You", goal: "", createdAt: Date.now(), courseId: null, plan: "free" };
  store.auth = { user, rememberMe: true };
  saveAuth(store.auth);
  store.tourStep = 0;
  route();
}

function handleOtpVerified() {
  if (store.pendingUser) {
    store.auth = { user: store.pendingUser, rememberMe: true };
    saveAuth(store.auth);
    store.pendingUser = null;
    store.tourStep = 0;
    route();
  }
}

function handleLogin(email, remember) {
  const user = {
    id: crypto.randomUUID(), email, name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
    goal: "", createdAt: Date.now(), courseId: null, plan: "free",
  };
  store.auth = { user, rememberMe: remember };
  if (remember) saveAuth(store.auth);
  store.tourStep = 0;
  route();
}

function handleLogout() {
  clearAuth();
  store.auth = { user: null, rememberMe: false };
  store.authScreen = "welcome";
  store.tab = "home";
  store.overlay = null;
  route();
}

function handleCourseSelect(courseId) {
  if (!store.auth.user) return;
  store.auth = { ...store.auth, user: { ...store.auth.user, courseId } };
  saveAuth(store.auth);
  store.progress = { ...store.progress, courseDay: 1, completedDays: [], dayScores: {} };
  store.overlay = null;
  route();
}

function handleSelectPlan(plan) {
  if (!store.auth.user) return;
  store.auth = { ...store.auth, user: { ...store.auth.user, plan } };
  saveAuth(store.auth);
  store.overlay = null;
  route();
}

function bind() {
  $("welcome-get-started").onclick = () => { store.authScreen = "signup"; route(); };
  $("welcome-login").onclick = () => { store.authScreen = "login"; route(); };
  $("signup-google").onclick = handleGoogleSignUp;
  $("signup-switch-login").onclick = () => { store.authScreen = "login"; route(); };
  $("signup-form").onsubmit = (e) => { e.preventDefault(); handleSignUp(); };
  ["signup-name", "signup-email", "signup-pw"].forEach((id) => $(id).addEventListener("input", updateSignupSubmit));
  $("signup-consent-voice").onclick = () => { store.consentVoice = !store.consentVoice; setCheck($("signup-consent-voice"), store.consentVoice); updateSignupSubmit(); };
  $("signup-consent-terms").onclick = () => { store.consentTerms = !store.consentTerms; setCheck($("signup-consent-terms"), store.consentTerms); updateSignupSubmit(); };
  $("signup-pw-toggle").onclick = () => { const i = $("signup-pw"); i.type = i.type === "password" ? "text" : "password"; };

  $("otp-back").onclick = () => { store.authScreen = "signup"; route(); };
  $("otp-verify").onclick = () => {
    const code = [0,1,2,3,4,5].map((i) => $(`otp-${i}`).value).join("");
    if (code === APP_CONFIG.otpCode) {
      $("otp-error").classList.add("hidden");
      $("otp-form-view").classList.add("hidden");
      $("otp-celebrate").classList.remove("hidden");
      setTimeout(handleOtpVerified, 2200);
    } else $("otp-error").classList.remove("hidden");
  };
  let resendTimer = 0;
  $("otp-resend").onclick = () => {
    if (resendTimer > 0) return;
    resendTimer = 30;
    $("otp-resend").disabled = true;
    const iv = setInterval(() => {
      resendTimer -= 1;
      $("otp-resend-label").textContent = resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code";
      if (resendTimer <= 0) { clearInterval(iv); $("otp-resend").disabled = false; }
    }, 1000);
  };
  for (let i = 0; i < 6; i++) {
    const el = $(`otp-${i}`);
    el.addEventListener("input", (e) => {
      $("otp-error").classList.add("hidden");
      let val = e.target.value.replace(/\D/g, "");
      if (val.length > 1) {
        const chars = val.slice(0, 6).split("");
        chars.forEach((c, idx) => { $(`otp-${idx}`).value = c; });
        return;
      }
      el.value = val;
      el.classList.toggle("border-brand-500", !!val);
      el.classList.toggle("border-ink-200", !val);
      if (val && i < 5) $(`otp-${i + 1}`).focus();
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !el.value && i > 0) $(`otp-${i - 1}`).focus();
    });
  }

  $("login-form").onsubmit = (e) => {
    e.preventDefault();
    const email = $("login-email").value.trim();
    const pw = $("login-pw").value.trim();
    if (!email || !pw) { $("login-error").classList.remove("hidden"); return; }
    $("login-error").classList.add("hidden");
    handleLogin(email, store.rememberMe);
  };
  $("login-remember").onclick = () => {
    store.rememberMe = !store.rememberMe;
    const b = $("login-remember");
    b.className = `flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${store.rememberMe ? "border-brand-500 bg-brand-500" : "border-ink-200 bg-surface-0"}`;
    b.innerHTML = store.rememberMe ? `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>` : "";
  };
  $("login-forgot").onclick = () => { store.authScreen = "forgot"; $("forgot-form-view").classList.remove("hidden"); $("forgot-sent-view").classList.add("hidden"); route(); };
  $("login-switch-signup").onclick = () => { store.authScreen = "signup"; route(); };
  $("login-pw-toggle").onclick = () => { const i = $("login-pw"); i.type = i.type === "password" ? "text" : "password"; };

  $("forgot-back").onclick = () => { store.authScreen = "login"; route(); };
  $("forgot-send").onclick = () => { $("forgot-form-view").classList.add("hidden"); $("forgot-sent-view").classList.remove("hidden"); };
  $("forgot-sent-back").onclick = () => { store.authScreen = "login"; route(); };

  $("tour-next").onclick = () => {
    if (store.tourStep < ONBOARDING_TOUR.length - 1) { store.tourStep += 1; renderTour(); }
    else { store.progress = { ...store.progress, seenTour: true }; persistProgress(); route(); }
  };
  $("tour-skip").onclick = $("tour-skip-x").onclick = () => { store.progress = { ...store.progress, seenTour: true }; persistProgress(); route(); };

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
    else if (act === "flashcards") { store.flash.idx = 0; store.flash.flipped = false; store.flash.learned = 0; store.flash.done = false; store.overlay = "flashcard"; route(); }
    else if (act === "start-mission") { startPractice(); }
    else if (act === "start-day") {
      const day = Number(btn.getAttribute("data-day"));
      if (store.auth.user.plan === "free" && day > FREE_TIER_MAX_DAY) { store.overlay = "plans"; route(); return; }
      startPractice({ courseDay: day });
    }
    else if (act === "upgrade") { store.overlay = "plans"; route(); }
  });

  $("tabnav").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    const t = btn.getAttribute("data-tab");
    if (t === "practice") startPractice({ fromTab: true });
    else { store.tab = t; store.overlay = null; route(); }
  });

  $("practice-exit").onclick = () => { stopTimer(); speechController.stopListening(); practiceExit(); };
  $("practice-skip").onclick = () => {
    const practice = store.practice;
    const questions = practiceQuestions();
    const hasCourseQs = practice.courseQuestions && practice.courseQuestions.length > 0;
    const totalPrompts = hasCourseQs ? questions.length : 3;
    resetForNext();
    if (practice.promptIdx < totalPrompts - 1) { practice.promptIdx += 1; renderPractice(); }
    else {
      handlePracticeComplete(practice.completedCount * 15, "");
      practiceExit();
    }
  };
  $("practice-scroll").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    const practice = store.practice;
    const questions = practiceQuestions();
    const prompt = questions[practice.promptIdx % questions.length];
    if (act === "replay") speechController.speak(prompt.text);
    else if (act === "rerecord") {
      const better = practice.feedback[1].better || prompt.text;
      speechController.speak(better);
      if (!practice.typingMode) startListening();
    } else if (act === "next-prompt") {
      const hasCourseQs = practice.courseQuestions && practice.courseQuestions.length > 0;
      const totalPrompts = hasCourseQs ? questions.length : 3;
      practice.completedCount += 1;
      if (practice.promptIdx < totalPrompts - 1) { practice.promptIdx += 1; resetForNext(); renderPractice(); }
      else { practice.showMood = true; renderPractice(); }
    }
  });
  $("practice-bottom").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    const practice = store.practice;
    if (act === "hint") { practice.showHint = true; renderPractice(); }
    else if (act === "mic") {
      if (practice.micState === "idle") startListening();
      else if (practice.micState === "listening") stopListening();
    } else if (act === "type-instead") {
      if (practice.micState === "listening") { speechController.stopListening(); stopTimer(); practice.micState = "idle"; }
      practice.typingMode = true; renderPractice();
    } else if (act === "switch-mic") { practice.typingMode = false; renderPractice(); }
    else if (act === "typed-send") handleTypedSubmit();
  });
  $("practice-mood").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act=mood]");
    if (!btn) return;
    const points = (store.practice.completedCount + 1) * 20;
    handlePracticeComplete(points, btn.getAttribute("data-id"));
    practiceExit();
  });

  $("flashcard-main").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "flash-exit") { store.overlay = null; route(); }
    else if (act === "flip-card") { store.flash.flipped = !store.flash.flipped; renderFlashcard(); }
    else if (act === "say-word") { e.stopPropagation(); speechController.speak(FLASHCARDS[store.flash.idx].word); }
    else if (act === "swipe-left") handleSwipe("left");
    else if (act === "swipe-right") handleSwipe("right");
    else if (act === "claim-cards") handleFlashcardComplete(store.flash.learned);
  });

  $("courseplan-back").onclick = () => { store.overlay = null; route(); };
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
    if (btn.getAttribute("data-act") === "see-badges") { store.showAllBadges = true; renderRewards(); }
    else if (btn.getAttribute("data-act") === "toggle-leaderboard") { store.showLeaderboard = !store.showLeaderboard; renderRewards(); }
  });

  $("profile-scroll").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "settings") { renderSettings(); openSheet("settings"); }
    else if (act === "change-course") { store.overlay = "courseChooser"; route(); }
    else if (act === "manage-plan") { store.overlay = "plans"; route(); }
    else if (act === "my-data") { store.deleteConfirmed = false; renderDeleteSheet(); openSheet("delete"); }
    else if (act === "logout") handleLogout();
    else if (act === "advance-day") {
      store.progress = { ...store.progress, simDateOffset: store.progress.simDateOffset + 1, courseDay: Math.min(30, store.progress.courseDay + 1) };
      persistProgress(); renderProfile();
    } else if (act === "edit-name") {
      store.nameInput = store.auth.user.name;
      store.editingName = true;
      renderProfile();
      const inp = $("profile-name-input");
      if (inp) { inp.focus(); inp.addEventListener("input", (e) => { store.nameInput = e.target.value; }); }
    } else if (act === "save-name") {
      if (store.nameInput.trim()) {
        store.auth = { ...store.auth, user: { ...store.auth.user, name: store.nameInput.trim() } };
        saveAuth(store.auth);
        store.editingName = false;
        renderProfile();
      }
    }
  });

  document.querySelectorAll("[data-sheet-close]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-sheet-close");
      closeSheet(id);
      if (id === "delete") store.deleteConfirmed = false;
    });
  });
  $("settings-body").addEventListener("click", (e) => {
    if (e.target.closest("[data-act=toggle-notif]")) { store.notifEnabled = !store.notifEnabled; renderSettings(); }
  });
  $("delete-actions").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "confirm-delete") { store.deleteConfirmed = true; renderDeleteSheet(); }
    else if (act === "cancel-delete" || act === "done-delete") { closeSheet("delete"); store.deleteConfirmed = false; }
  });

  window.addEventListener("online", () => { if (store.tab === "home" && store.auth.user) setOfflineBanner(); });
  window.addEventListener("offline", () => { if (store.tab === "home" && store.auth.user) setOfflineBanner(); });
}

bind();
route();
