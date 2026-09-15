const MODEL = "claude-haiku-4-5";

export const config = { runtime: "edge" };

const SYSTEM = `You are ByoU, a warm speaking coach for Indian job seekers who can read and write English but freeze when speaking. You want them to succeed.

Return ONLY strict JSON, no markdown, no prose, no extra keys:
{
  "whatWorked": "one genuinely encouraging, specific observation about their attempt — never a generic line",
  "oneUpgrade": "ONE specific, actionable, kind tip tailored to THIS answer — never a generic line",
  "youCouldHaveSaid": "a polished, natural, confident model answer to the QUESTION — a clearer, more structured way to say what they were reaching for. It must NOT be a copy of the user's words; rewrite and improve, relatable to the question asked, do not echo.",
  "sayItOnceMore": "one short target sentence for them to repeat aloud"
}

HARD RULES
- The words "wrong", "mistake", and "grammar" must NEVER appear in any field.
- youCouldHaveSaid must NOT copy or nearly copy their spoken answer. Improve it. Make it sound like a confident interview answer.
- Do not use fill-in-the-blank templates like "____".
- Keep each field to 1–2 short sentences of spoken English.`;

const BANNED = /\b(wrong|mistake|mistakes|grammar)\b/i;
const KEYS = ["whatWorked", "oneUpgrade", "youCouldHaveSaid", "sayItOnceMore"];

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nearCopy(a, b) {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const wa = left.split(" ").filter(Boolean);
  const wb = right.split(" ").filter(Boolean);
  if (!wa.length || !wb.length) return false;
  const setB = new Set(wb);
  const overlap = wa.filter((w) => setB.has(w)).length;
  return (2 * overlap) / (wa.length + wb.length) >= 0.86;
}

function stripFences(text) {
  const fenced = String(text || "").match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

function parseFeedback(raw) {
  const stripped = stripFences(raw);
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    const out = {};
    for (const key of KEYS) {
      if (typeof parsed[key] !== "string" || !parsed[key].trim()) return null;
      out[key] = parsed[key].trim();
    }
    return out;
  } catch {
    return null;
  }
}

function issues(feedback, transcript) {
  const found = [];
  if (KEYS.some((key) => BANNED.test(feedback[key]))) found.push("banned");
  if (nearCopy(feedback.youCouldHaveSaid, transcript)) found.push("echo");
  return found;
}

function stripBanned(feedback) {
  const next = { ...feedback };
  for (const key of KEYS) {
    next[key] = next[key].replace(BANNED, "").replace(/\s+/g, " ").trim();
    if (!next[key]) return null;
  }
  return next;
}

async function callAnthropic(userContent) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("missing_key");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error("llm_failed");
  const block = Array.isArray(data.content) ? data.content.find((b) => b.type === "text") : null;
  return String(block?.text || "");
}

async function viaSupabase(question, transcript) {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const anon = process.env.SUPABASE_ANON_KEY || process.env.ANON_KEY || "";
  if (!url || !anon) throw new Error("missing_key");
  const response = await fetch(`${url}/functions/v1/feedback`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      "content-type": "application/json",
    },
    body: JSON.stringify({ question, transcript, input_mode: "spoken" }),
  });
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw new Error("llm_failed");
  const mapped = {
    whatWorked: String(data.praise || "").trim(),
    oneUpgrade: String(data.one_upgrade || "").trim(),
    youCouldHaveSaid: String(data.could_have_said || "").trim(),
    sayItOnceMore: String(data.resay_sentence || "").trim(),
  };
  if (KEYS.some((key) => !mapped[key])) return null;
  return mapped;
}

async function generate(question, transcript, extra = "") {
  if (process.env.ANTHROPIC_API_KEY) {
    const user = `Question: ${question}\nMy spoken answer: ${transcript}${extra ? `\n\n${extra}` : ""}`;
    const raw = await callAnthropic(user);
    return parseFeedback(raw);
  }
  return viaSupabase(question, transcript);
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") {
    return Response.json({ error: "method" }, { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const question = String(body.question || "").trim();
  const transcript = String(body.transcript || "").trim();
  if (!question) return Response.json({ error: "missing_question" }, { status: 400 });

  try {
    let feedback = await generate(question, transcript);
    let problems = feedback ? issues(feedback, transcript) : ["invalid"];

    if (!feedback || problems.length) {
      const extra = [
        problems.includes("echo")
          ? "CRITICAL: youCouldHaveSaid was too close to the learner's words. Improve it, do not repeat the user."
          : "",
        problems.includes("banned")
          ? "CRITICAL: Never use the words wrong, mistake, or grammar."
          : "",
        "Return valid JSON only, with all four keys as non-empty strings.",
      ].filter(Boolean).join(" ");
      feedback = await generate(question, transcript, extra);
      problems = feedback ? issues(feedback, transcript) : ["invalid"];
    }

    if (feedback && problems.includes("banned") && !problems.includes("echo")) {
      feedback = stripBanned(feedback);
      problems = feedback ? issues(feedback, transcript) : ["invalid"];
    }

    if (!feedback || problems.length) {
      return Response.json({ error: "feedback_failed" }, { status: 502 });
    }

    return Response.json(feedback);
  } catch (err) {
    const missing = err instanceof Error && err.message === "missing_key";
    return Response.json(
      { error: missing ? "feedback_unavailable" : "feedback_failed" },
      { status: missing ? 500 : 502 },
    );
  }
}
