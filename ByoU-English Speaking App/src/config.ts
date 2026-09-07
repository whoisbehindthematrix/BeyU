export type Difficulty = "easy" | "medium" | "hard";

export interface FlashcardItem {
  id: string;
  word: string;
  meaning: string;
  example: string;
}

export interface PromptItem {
  id: string;
  text: string;
  difficulty: Difficulty;
  hint: string;
  idealKeywords: string[];
}

export interface MissionItem {
  id: string;
  title: string;
  subtitle: string;
  type: "prompt" | "flashcard" | "conversation";
  difficulty: Difficulty;
  points: number;
}

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
  welcome: {
    title: "Speak English,\nwith confidence.",
    subtitle:
      "ByoU is your private speaking coach. Practice real conversations, get gentle feedback, and build a streak — all on your phone.",
  },
  signup: {
    title: "Create your account",
    subtitle: "Week 1 free \u2014 no card needed.",
    consentText:
      "Before we start:\n• ByoU records your voice during practice so the AI can coach you.\n• Your recordings are private — only you can hear them. Delete them anytime in Profile → My data.\n• You are 16+ and accept our Terms & Privacy.",
    consentLabelVoice: "I agree that ByoU records my voice during practice",
    consentLabelTerms: "I accept the Terms & Privacy Policy",
    mismatch: "Passwords don't match",
    weak: "Use at least 8 characters",
    ok: "Looks good ✓",
  },
  otp: {
    title: "Check your inbox",
    subtitle: (email: string) =>
      `We sent a 6-digit code to ${email}.`,
    demoNote: "Demo code: 123456",
    resend: "Resend code",
    wrong: "Hmm, that code isn't right. Try 123456.",
  },
  login: {
    title: "Welcome back",
    subtitle: "Pick up your streak where you left off.",
    remember: "Remember me",
    forgot: "Forgot password?",
    invalid: "Email or password is incorrect",
  },
  forgot: {
    title: "Reset password",
    subtitle:
      "Enter your email and we'll send a reset link.",
    sent: "If that email exists, a reset link is on its way.",
  },
};

export const ONBOARDING_TOUR = [
  {
    id: "home",
    title: "Your daily home",
    body: "Every day you'll see a fresh mission and your streak. Tap it to start practising in under a minute.",
    icon: "home",
  },
  {
    id: "mic",
    title: "Just press and talk",
    body: "Tap the mic, answer the prompt in your own words. ByoU transcribes and gives you friendly feedback.",
    icon: "mic",
  },
  {
    id: "feedback",
    title: "Feedback that helps",
    body: "You'll see filler words, clarity, and a better way to say it — never harsh, always actionable.",
    icon: "feedback",
  },
  {
    id: "rewards",
    title: "Build your streak",
    body: "Finish a mission to earn points and keep your streak alive. Consistency beats perfection.",
    icon: "trophy",
  },
] as const;

export const FLASHCARDS: FlashcardItem[] = [
  {
    id: "fc1",
    word: "actually",
    meaning: "used to clarify or correct gently",
    example: "I actually think that's a great idea.",
  },
  {
    id: "fc2",
    word: "absolutely",
    meaning: "with complete certainty; yes for sure",
    example: "Absolutely, I can help with that.",
  },
  {
    id: "fc3",
    word: "essentially",
    meaning: "at its core; most importantly",
    example: "Essentially, it comes down to timing.",
  },
  {
    id: "fc4",
    word: "genuinely",
    meaning: "truly; really",
    example: "I genuinely enjoyed working on that project.",
  },
  {
    id: "fc5",
    word: "confidently",
    meaning: "with certainty; boldly",
    example: "I can confidently say I learned a lot.",
  },
  {
    id: "fc6",
    word: "specifically",
    meaning: "in a particular way; precisely",
    example: "Specifically, I worked on the backend team.",
  },
  {
    id: "fc7",
    word: "worthwhile",
    meaning: "worth the time or effort; valuable",
    example: "The training was worthwhile for my career.",
  },
  {
    id: "fc8",
    word: "initiative",
    meaning: "taking action without being told",
    example: "I took the initiative to lead the project.",
  },
  {
    id: "fc9",
    word: "collaborate",
    meaning: "work together with others",
    example: "I love to collaborate with different teams.",
  },
  {
    id: "fc10",
    word: "enthusiastic",
    meaning: "excited and eager",
    example: "I'm enthusiastic about this opportunity.",
  },
];

export const PROMPTS: PromptItem[] = [
  {
    id: "p1",
    text: "Tell me about your hometown. What do you love most about it?",
    difficulty: "easy",
    hint: "Try: name the city, mention one thing you enjoy, share a small memory.",
    idealKeywords: ["hometown", "love", "enjoy", "grew", "city", "place"],
  },
  {
    id: "p2",
    text: "Describe a skill you're proud of and how you learned it.",
    difficulty: "easy",
    hint: "Name the skill, say how long it took, mention who taught you.",
    idealKeywords: ["skill", "learned", "practice", "proud", "taught"],
  },
  {
    id: "p3",
    text: "If you could have dinner with anyone, who would it be and why?",
    difficulty: "medium",
    hint: "Pick a person, give one reason, imagine one question you'd ask them.",
    idealKeywords: ["dinner", "person", "because", "ask", "admire"],
  },
  {
    id: "p4",
    text: "You're in a job interview. Tell me about a challenge you overcame.",
    difficulty: "hard",
    hint: "Set the scene, describe the action you took, share the result.",
    idealKeywords: ["challenge", "overcame", "situation", "result", "team", "problem"],
  },
  {
    id: "p5",
    text: "Convince me to visit your favourite restaurant.",
    difficulty: "medium",
    hint: "Name the place, describe the food, give one reason I should go.",
    idealKeywords: ["restaurant", "food", "favourite", "recommend", "delicious", "ambience"],
  },
  {
    id: "p6",
    text: "What's a book or movie that changed how you think? Explain why.",
    difficulty: "medium",
    hint: "Name it, say what changed, mention one specific moment.",
    idealKeywords: ["book", "movie", "changed", "think", "because", "story"],
  },
];

export const MISSIONS: MissionItem[] = [
  {
    id: "m1",
    title: "'Tell me about yourself' — retail interview",
    subtitle: "5 minutes · 2 questions",
    type: "prompt",
    difficulty: "easy",
    points: 20,
  },
  {
    id: "m2",
    title: "Flashcard warm-up",
    subtitle: "20 words · ~90 sec",
    type: "flashcard",
    difficulty: "easy",
    points: 10,
  },
  {
    id: "m3",
    title: "A challenge you overcame",
    subtitle: "5 minutes · 2 questions",
    type: "prompt",
    difficulty: "hard",
    points: 35,
  },
];

export const BADGES = [
  {
    id: "b1",
    name: "First Session",
    desc: "Finish your first mission",
    icon: "message",
    threshold: 1,
    field: "missionsCompleted" as const,
  },
  {
    id: "b2",
    name: "3-Day Streak",
    desc: "Practice 3 days in a row",
    icon: "flame",
    threshold: 3,
    field: "streak" as const,
  },
  {
    id: "b3",
    name: "Comeback",
    desc: "Start a new streak after a break",
    icon: "calendar",
    threshold: 1,
    field: "missionsCompleted" as const,
  },
  {
    id: "b4",
    name: "100 Words",
    desc: "Learn 100 flashcards",
    icon: "book",
    threshold: 100,
    field: "flashcardsLearned" as const,
  },
  {
    id: "b5",
    name: "Century Club",
    desc: "Earn 100 points",
    icon: "star",
    threshold: 100,
    field: "points" as const,
  },
];

export const LEADERBOARD = [
  { name: "Aarav", points: 420, avatar: "A" },
  { name: "Priya", points: 385, avatar: "P" },
  { name: "You", points: 0, avatar: "U", isYou: true },
  { name: "Kabir", points: 210, avatar: "K" },
  { name: "Meera", points: 175, avatar: "M" },
  { name: "Dev", points: 120, avatar: "D" },
];

export const GOAL_CHIPS = [
  "Interview Ready",
  "General Conversation",
  "Both",
];

export const SETTINGS_OPTIONS = [
  { id: "notifications", label: "Daily reminder", type: "toggle" as const },
  { id: "myData", label: "My data", type: "link" as const },
  { id: "privacy", label: "Terms & Privacy", type: "link" as const },
  { id: "help", label: "Help & support", type: "link" as const },
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
