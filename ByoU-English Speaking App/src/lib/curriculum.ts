import type { CourseId } from "./storage";

export interface DayLesson {
  day: number;
  title: string;
  questions: string[];
  phrases: string[];
}

export interface WeekBlock {
  week: number;
  title: string;
  days: DayLesson[];
}

export interface CourseCurriculum {
  id: CourseId;
  name: string;
  emoji: string;
  tagline: string;
  weeks: WeekBlock[];
}

const interviewWeeks: WeekBlock[] = [
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
  {
    week: 2,
    title: "Talk about your work",
    days: Array.from({ length: 7 }, (_, i) => ({
      day: 8 + i,
      title: "Coming up…",
      questions: [],
      phrases: [],
    })),
  },
  {
    week: 3,
    title: "The classic questions",
    days: Array.from({ length: 7 }, (_, i) => ({
      day: 15 + i,
      title: "Coming up…",
      questions: [],
      phrases: [],
    })),
  },
  {
    week: 4,
    title: "Pressure-proof",
    days: Array.from({ length: 9 }, (_, i) => ({
      day: 22 + i,
      title: "Coming up…",
      questions: [],
      phrases: [],
    })),
  },
];

const conversationWeeks: WeekBlock[] = [
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
  {
    week: 2,
    title: "Plans & stories",
    days: Array.from({ length: 7 }, (_, i) => ({
      day: 8 + i,
      title: "Coming up…",
      questions: [],
      phrases: [],
    })),
  },
  {
    week: 3,
    title: "Opinions & reactions",
    days: Array.from({ length: 7 }, (_, i) => ({
      day: 15 + i,
      title: "Coming up…",
      questions: [],
      phrases: [],
    })),
  },
  {
    week: 4,
    title: "Real-world situations",
    days: Array.from({ length: 9 }, (_, i) => ({
      day: 22 + i,
      title: "Coming up…",
      questions: [],
      phrases: [],
    })),
  },
];

const combinedWeeks: WeekBlock[] = [
  {
    week: 1,
    title: "The complete path — Week 1",
    days: [
      interviewWeeks[0].days[0], // D1 interview
      interviewWeeks[0].days[1], // D2 interview
      interviewWeeks[0].days[2], // D3 interview
      interviewWeeks[0].days[3], // D4 interview
      { ...conversationWeeks[0].days[1], day: 5 }, // D5 = conversation D2
      { ...conversationWeeks[0].days[2], day: 6 }, // D6 = conversation D3
      { day: 7, title: "Mixed review — mini mock", questions: ["Tell me about yourself.", "What did you do this weekend?"], phrases: ["Review all phrases from this week."] },
    ],
  },
  {
    week: 2,
    title: "The complete path — Week 2",
    days: Array.from({ length: 7 }, (_, i) => ({
      day: 8 + i,
      title: "Coming up…",
      questions: [],
      phrases: [],
    })),
  },
  {
    week: 3,
    title: "The complete path — Week 3",
    days: Array.from({ length: 7 }, (_, i) => ({
      day: 15 + i,
      title: "Coming up…",
      questions: [],
      phrases: [],
    })),
  },
  {
    week: 4,
    title: "The complete path — Week 4",
    days: Array.from({ length: 9 }, (_, i) => ({
      day: 22 + i,
      title: "Coming up…",
      questions: [],
      phrases: [],
    })),
  },
];

export const COURSES: Record<CourseId, CourseCurriculum> = {
  interview: {
    id: "interview",
    name: "Interview Preparation",
    emoji: "🎯",
    tagline: "Crack your next job interview. 30 days.",
    weeks: interviewWeeks,
  },
  conversation: {
    id: "conversation",
    name: "General Conversation",
    emoji: "💬",
    tagline: "Speak easily in daily life. 30 days.",
    weeks: conversationWeeks,
  },
  combined: {
    id: "combined",
    name: "Interview + Conversation",
    emoji: "🚀",
    tagline: "The complete course. 30 days.",
    weeks: combinedWeeks,
  },
};

export function getCourseDay(courseId: CourseId, day: number): DayLesson | null {
  const course = COURSES[courseId];
  for (const week of course.weeks) {
    const found = week.days.find((d) => d.day === day);
    if (found) return found;
  }
  return null;
}

export function getTotalDays(_courseId: CourseId): number {
  return 30;
}

export const MOCK_DAYS = [7, 14, 21, 28];
