export type MicState = "idle" | "listening" | "processing";

export interface FeedbackChunk {
  id: "worked" | "upgrade" | "drill";
  icon: "worked" | "upgrade" | "drill";
  title: string;
  body: string;
  tone: "positive" | "tip" | "drill";
  quote?: string;
  better?: string;
}

const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "literally",
  "sort of",
  "kind of",
  "yeah",
  "so yeah",
];

export function countFillerWords(transcript: string): { count: number; found: string[] } {
  const lower = transcript.toLowerCase();
  const found: string[] = [];
  for (const w of FILLER_WORDS) {
    const regex = new RegExp(`\\b${w}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) found.push(...matches);
  }
  return { count: found.length, found: [...new Set(found)] };
}

export function countWords(transcript: string): number {
  const trimmed = transcript.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function checkKeywords(transcript: string, keywords: string[]): number {
  const lower = transcript.toLowerCase();
  let hit = 0;
  for (const k of keywords) {
    if (lower.includes(k.toLowerCase())) hit++;
  }
  return Math.min(hit, keywords.length);
}

function extractQuote(transcript: string): string {
  const words = transcript.trim().split(/\s+/);
  if (words.length <= 6) return transcript.trim();
  const start = Math.min(2, words.length - 3);
  const snippet = words.slice(start, start + 4).join(" ");
  return snippet;
}

const UPGRADE_PAIRS: { from: string; to: string; why: string }[] = [
  { from: "very good", to: "excellent", why: "one strong word beats two weak ones." },
  { from: "i think", to: "I'd say", why: "it sounds more natural and confident." },
  { from: "a lot of", to: "plenty of", why: "it's smoother and less repetitive." },
  { from: "kind of", to: "somewhat", why: "it's more precise and professional." },
  { from: "really", to: "truly", why: "it adds emphasis without sounding casual." },
  { from: "get", to: "gain", why: "it sounds more professional in an interview." },
  { from: "stuff", to: "tasks", why: "it's clearer and more specific." },
];

function findUpgrade(transcript: string): { quote: string; better: string; why: string } | null {
  const lower = transcript.toLowerCase();
  for (const pair of UPGRADE_PAIRS) {
    if (lower.includes(pair.from)) {
      const idx = lower.indexOf(pair.from);
      const original = transcript.substring(idx, idx + pair.from.length);
      return {
        quote: original,
        better: pair.to,
        why: pair.why,
      };
    }
  }
  return null;
}

export interface FeedbackTemplates {
  worked: string[];
  upgrade: string[];
  drill: string[];
}

export function generateFeedback(
  transcript: string,
  _idealKeywords: string[],
  templates: FeedbackTemplates,
): FeedbackChunk[] {
  const wordCount = countWords(transcript);
  const quote = wordCount > 0 ? extractQuote(transcript) : "your answer";
  const upgrade = findUpgrade(transcript);

  // Chunk 1: What worked
  const workedBody = wordCount === 0
    ? "You showed up and tried — that's the hardest part. Coming back tomorrow will feel easier."
    : templates.worked[Math.floor(Math.random() * templates.worked.length)].replace("{quote}", quote);

  const chunks: FeedbackChunk[] = [
    {
      id: "worked",
      icon: "worked",
      title: "What worked",
      body: workedBody,
      tone: "positive",
    },
  ];

  // Chunk 2: One upgrade
  if (upgrade) {
    const upgradeBody = templates.upgrade[Math.floor(Math.random() * templates.upgrade.length)]
      .replace("{quote}", upgrade.quote)
      .replace("{better}", upgrade.better)
      .replace("{why}", upgrade.why);
    chunks.push({
      id: "upgrade",
      icon: "upgrade",
      title: "One upgrade",
      body: upgradeBody,
      tone: "tip",
      quote: upgrade.quote,
      better: upgrade.better,
    });
  } else {
    chunks.push({
      id: "upgrade",
      icon: "upgrade",
      title: "One upgrade",
      body: wordCount > 0
        ? `Try linking your sentences: "I grew up there, which is why I love it." It makes your ideas flow naturally.`
        : "Next time, try starting with 'I'd say…' to sound natural and confident.",
      tone: "tip",
    });
  }

  // Chunk 3: Say it once more
  chunks.push({
    id: "drill",
    icon: "drill",
    title: "Say it once more",
    body: templates.drill[Math.floor(Math.random() * templates.drill.length)],
    tone: "drill",
  });

  return chunks;
}

export function computeScore(transcript: string, idealKeywords: string[]): number {
  const wordCount = countWords(transcript);
  const { count: fillerCount } = countFillerWords(transcript);
  const keywordHits = checkKeywords(transcript, idealKeywords);

  let score = 50;
  if (wordCount >= 15) score += 15;
  if (wordCount >= 30) score += 10;
  score += keywordHits * 5;
  score -= fillerCount * 4;
  if (wordCount === 0) score = 0;
  return Math.max(0, Math.min(100, score));
}
