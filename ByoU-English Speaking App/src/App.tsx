import { useState, useEffect } from "react";
import { Welcome } from "./components/Welcome";
import { SignUp } from "./components/SignUp";
import { Otp } from "./components/Otp";
import { Login } from "./components/Login";
import { Forgot } from "./components/Forgot";
import { OnboardingTour } from "./components/OnboardingTour";
import { CourseChooser } from "./components/CourseChooser";
import { Home } from "./components/Home";
import { Practice } from "./components/Practice";
import { FlashcardDeck } from "./components/FlashcardDeck";
import { CoursePlan } from "./components/CoursePlan";
import { Plans } from "./components/Plans";
import { Rewards } from "./components/Rewards";
import { Profile } from "./components/Profile";
import { TabNav, type Tab } from "./components/TabNav";
import { OfflineBanner } from "./components/OfflineBanner";
import type { UserSession, ProgressState, AuthState, CourseId, PlanTier } from "./lib/storage";
import {
  loadAuth,
  saveAuth,
  clearAuth,
  loadProgress,
  saveProgress,
  updateStreakOnPractice,
  todayStr,
  FREE_TIER_MAX_DAY,
} from "./lib/storage";
import { MISSIONS } from "./config";
import { getCourseDay } from "./lib/curriculum";

type AuthScreen = "welcome" | "signup" | "otp" | "login" | "forgot";
type Overlay = null | "practice" | "flashcard" | "coursePlan" | "plans" | "courseChooser";

export default function App() {
  const [auth, setAuth] = useState<AuthState>(() => loadAuth());
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [authScreen, setAuthScreen] = useState<AuthScreen>("welcome");
  const [pendingUser, setPendingUser] = useState<UserSession | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [courseDayOverride, setCourseDayOverride] = useState<number | null>(null);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // --- Auth handlers ---

  const handleSignUp = (user: UserSession) => {
    setPendingUser(user);
    setPendingEmail(user.email);
    setAuthScreen("otp");
  };

  const handleGoogleSignUp = () => {
    const user: UserSession = {
      id: crypto.randomUUID(),
      email: "you@gmail.com",
      name: "You",
      goal: "",
      createdAt: Date.now(),
      courseId: null,
      plan: "free",
    };
    const newAuth: AuthState = { user, rememberMe: true };
    setAuth(newAuth);
    saveAuth(newAuth);
  };

  const handleOtpVerified = () => {
    if (pendingUser) {
      const newAuth: AuthState = { user: pendingUser, rememberMe: true };
      setAuth(newAuth);
      saveAuth(newAuth);
      setPendingUser(null);
    }
  };

  const handleLogin = (email: string, remember: boolean) => {
    const user: UserSession = {
      id: crypto.randomUUID(),
      email,
      name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
      goal: "",
      createdAt: Date.now(),
      courseId: null,
      plan: "free",
    };
    const newAuth: AuthState = { user, rememberMe: remember };
    setAuth(newAuth);
    if (remember) saveAuth(newAuth);
  };

  const handleLogout = () => {
    clearAuth();
    setAuth({ user: null, rememberMe: false });
    setAuthScreen("welcome");
    setTab("home");
    setOverlay(null);
  };

  // --- Course handlers ---

  const handleCourseSelect = (courseId: CourseId) => {
    if (!auth.user) return;
    const updated: UserSession = { ...auth.user, courseId };
    const newAuth = { ...auth, user: updated };
    setAuth(newAuth);
    saveAuth(newAuth);
    setProgress((prev) => ({
      ...prev,
      courseDay: 1,
      completedDays: [],
      dayScores: {},
    }));
    setOverlay(null);
  };

  const handleChangeCourse = () => {
    setOverlay("courseChooser");
  };

  // --- Plan handlers ---

  const handleSelectPlan = (plan: PlanTier) => {
    if (!auth.user) return;
    const updated: UserSession = { ...auth.user, plan };
    const newAuth = { ...auth, user: updated };
    setAuth(newAuth);
    saveAuth(newAuth);
    setOverlay(null);
  };

  // --- Practice handlers ---

  const handleStartMission = (_missionId: string) => {
    setCourseDayOverride(null);
    setOverlay("practice");
  };

  const handleStartCourseDay = (day: number) => {
    if (auth.user?.plan === "free" && day > FREE_TIER_MAX_DAY) {
      setOverlay("plans");
      return;
    }
    setCourseDayOverride(day);
    setOverlay("practice");
  };

  const handlePracticeComplete = (points: number, mood: string) => {
    setOverlay(null);
    setProgress((prev) => {
      const withStreak = updateStreakOnPractice(prev);
      const dayNum = courseDayOverride || prev.courseDay;
      const completedDays = prev.completedDays.includes(dayNum)
        ? prev.completedDays
        : [...prev.completedDays, dayNum];

      let nextCourseDay = prev.courseDay;
      if (dayNum === prev.courseDay && !prev.completedDays.includes(dayNum)) {
        nextCourseDay = Math.min(30, prev.courseDay + 1);
      }

      return {
        ...withStreak,
        points: withStreak.points + points,
        missionsCompleted: withStreak.missionsCompleted + 1,
        weeklyMinutes: withStreak.weeklyMinutes + 5,
        weeklyStartDay: withStreak.weeklyStartDay || todayStr(withStreak.simDateOffset),
        lastMissionId: MISSIONS[0].id,
        completedDays,
        courseDay: nextCourseDay,
        moodHistory:
          mood !== ""
            ? [...withStreak.moodHistory, { date: todayStr(withStreak.simDateOffset), mood }]
            : withStreak.moodHistory,
      };
    });
    setCourseDayOverride(null);
    setTab("rewards");
  };

  const handleFlashcardComplete = (learned: number) => {
    setOverlay(null);
    setProgress((prev) => {
      const withStreak = updateStreakOnPractice(prev);
      return {
        ...withStreak,
        points: withStreak.points + learned * 2,
        flashcardsLearned: withStreak.flashcardsLearned + learned,
        weeklyMinutes: withStreak.weeklyMinutes + 3,
        weeklyStartDay: withStreak.weeklyStartDay || todayStr(withStreak.simDateOffset),
      };
    });
    setTab("home");
  };

  // --- Profile handlers ---

  const handleUpdateGoal = (goal: string) => {
    if (!auth.user) return;
    const updated = { ...auth.user, goal };
    const newAuth = { ...auth, user: updated };
    setAuth(newAuth);
    saveAuth(newAuth);
  };

  const handleUpdateName = (name: string) => {
    if (!auth.user) return;
    const updated = { ...auth.user, name };
    const newAuth = { ...auth, user: updated };
    setAuth(newAuth);
    saveAuth(newAuth);
  };

  const handleDeleteRecordings = () => {};

  const handleTourComplete = () => {
    setProgress((prev) => ({ ...prev, seenTour: true }));
  };

  const handleAdvanceDay = () => {
    setProgress((prev) => ({
      ...prev,
      simDateOffset: prev.simDateOffset + 1,
      courseDay: Math.min(30, prev.courseDay + 1),
    }));
  };

  // --- Get course-day prompts for Practice ---
  const practiceQuestions = (() => {
    if (courseDayOverride && auth.user?.courseId) {
      const lesson = getCourseDay(auth.user.courseId, courseDayOverride);
      if (lesson && lesson.questions.length > 0) return lesson.questions;
    }
    return null;
  })();

  // ===== RENDER =====

  // Auth flow
  if (!auth.user) {
    return (
      <PhoneFrame>
        {authScreen === "welcome" && (
          <Welcome
            onGetStarted={() => setAuthScreen("signup")}
            onLogin={() => setAuthScreen("login")}
          />
        )}
        {authScreen === "signup" && (
          <SignUp
            onSignUp={handleSignUp}
            onGoogleSignUp={handleGoogleSignUp}
            onSwitchLogin={() => setAuthScreen("login")}
          />
        )}
        {authScreen === "otp" && (
          <Otp
            email={pendingEmail}
            onVerify={handleOtpVerified}
            onBack={() => setAuthScreen("signup")}
          />
        )}
        {authScreen === "login" && (
          <Login
            onLogin={handleLogin}
            onSwitchSignUp={() => setAuthScreen("signup")}
            onForgot={() => setAuthScreen("forgot")}
          />
        )}
        {authScreen === "forgot" && (
          <Forgot onBack={() => setAuthScreen("login")} />
        )}
      </PhoneFrame>
    );
  }

  // Onboarding tour
  if (!progress.seenTour) {
    return (
      <PhoneFrame>
        <OnboardingTour onComplete={handleTourComplete} />
      </PhoneFrame>
    );
  }

  // Course chooser (first time or changing course)
  if (!auth.user.courseId || overlay === "courseChooser") {
    return (
      <PhoneFrame>
        <CourseChooser onSelect={handleCourseSelect} />
      </PhoneFrame>
    );
  }

  // Full-screen overlays
  if (overlay === "practice") {
    return (
      <PhoneFrame>
        <Practice
          onComplete={handlePracticeComplete}
          onExit={() => { setOverlay(null); setCourseDayOverride(null); }}
          courseQuestions={practiceQuestions}
        />
      </PhoneFrame>
    );
  }

  if (overlay === "flashcard") {
    return (
      <PhoneFrame>
        <FlashcardDeck
          onComplete={handleFlashcardComplete}
          onExit={() => setOverlay(null)}
        />
      </PhoneFrame>
    );
  }

  if (overlay === "coursePlan") {
    return (
      <PhoneFrame>
        <CoursePlan
          courseId={auth.user.courseId}
          progress={progress}
          plan={auth.user.plan}
          onStartDay={handleStartCourseDay}
          onUpgrade={() => setOverlay("plans")}
          onBack={() => setOverlay(null)}
        />
      </PhoneFrame>
    );
  }

  if (overlay === "plans") {
    return (
      <PhoneFrame>
        <Plans
          currentPlan={auth.user.plan}
          onSelectPlan={handleSelectPlan}
          onBack={() => setOverlay(null)}
        />
      </PhoneFrame>
    );
  }

  // Main tabbed app
  return (
    <PhoneFrame>
      <OfflineBanner />
      {tab === "home" && (
        <Home
          user={auth.user}
          progress={progress}
          onStartMission={handleStartMission}
          onGoFlashcards={() => setOverlay("flashcard")}
          onGoRewards={() => setTab("rewards")}
          onGoCoursePlan={() => setOverlay("coursePlan")}
          onStartCourseDay={handleStartCourseDay}
          onUpgrade={() => setOverlay("plans")}
        />
      )}
      {tab === "practice" && (
        <Practice
          onComplete={handlePracticeComplete}
          onExit={() => setTab("home")}
        />
      )}
      {tab === "rewards" && <Rewards progress={progress} />}
      {/* intentional: TabNav hidden below when practice tab is active */}
      {tab === "profile" && (
        <Profile
          user={auth.user}
          progress={progress}
          onUpdateGoal={handleUpdateGoal}
          onUpdateName={handleUpdateName}
          onDeleteRecordings={handleDeleteRecordings}
          onLogout={handleLogout}
          onChangeCourse={handleChangeCourse}
          onManagePlan={() => setOverlay("plans")}
          onAdvanceDay={handleAdvanceDay}
        />
      )}
      {tab !== "practice" && <TabNav active={tab} onChange={setTab} />}
    </PhoneFrame>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-ink-900 sm:p-6">
      <div className="relative flex h-screen w-full max-w-[420px] flex-col overflow-hidden bg-surface-1 sm:h-[860px] sm:rounded-[2.5rem] sm:border-[10px] sm:border-ink-900 sm:shadow-2xl">
        {children}
      </div>
    </div>
  );
}
