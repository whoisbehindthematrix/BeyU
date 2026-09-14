export {};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BANNED = /\b(wrong|mistakes?|grammar|grammatical|errors?|incorrect|poor|bad|fail(ed|ure)?)\b/i;
const SAFE = {
  praise: "You spoke — that is the hardest part.",
  one_upgrade: "Next time, add one more sentence about why.",
  resay_sentence: "I am ready to practise and improve every day.",
  could_have_said: "I am ready to practise and speak a little more clearly every day.",
  used_target_words: [] as string[],
  confidence_score: 3,
};
const STOPWORDS = new Set([
  "the", "and", "for", "you", "your", "that", "this", "with", "from", "was", "are",
  "but", "not", "have", "had", "has", "they", "them", "their", "our", "out", "all",
  "very", "just", "like", "then", "than", "into", "about", "what", "when", "who",
]);
const CLAUDE_BUDGET_MS = 2400;
const PROMPT_VERSION = "v6";
const STATIC_PROMPT = `You are ByoU, a warm English speaking coach for Indian job seekers who can read and write English but freeze when speaking. Your only job is to make the learner want to speak again tomorrow.

RESPOND WITH ONLY THIS JSON
{
  "praise": "<one specific thing they did well, 12 words max, quote their own phrase>",
  "one_upgrade": "<one small change that makes them sound more confident, phrased as a suggestion, 20 words max>",
  "could_have_said": "<their full answer rewritten as 1-4 natural spoken sentences, 20-70 words>",
  "resay_sentence": "<a single natural sentence, 8-14 words, they should say aloud now, using their own idea>",
  "used_target_words": ["<any target words they actually said>"],
  "confidence_score": <1-5, how fluent and complete the answer sounded>
}

RULES
- Never use these words or their variants: wrong, mistake, grammar, error, incorrect, poor, bad, fail.
- Praise must quote a phrase they actually said. "Good job" is not praise.
- One upgrade only. Never a list.
- Indian English is valid English. "Do the needful", "prepone", "I have a doubt" are fine to keep when they fit.
- could_have_said must keep their meaning and details. Do not invent new facts. Smooth word order, choose clearer words, and make it sound spoken and confident — as if they said their best version. Do not list corrections. Do not start with "You could have said".
- If input mode is typed, could_have_said must rewrite THEIR typed sentences. Never replace their meaning with a generic model answer. Never treat their typing as empty speech-to-text.
- If input mode is spoken AND the transcript is empty or under 5 words, praise the attempt, set one_upgrade to encourage a longer answer, could_have_said to a 2-sentence model answer to the question, resay_sentence to one short line from that model. If typed, even a short answer is the real answer — rewrite it, do not invent a different one.
- If the transcript is off-topic, gently steer with resay_sentence and could_have_said; do not scold.
- Never mention that you are an AI, never discuss anything outside spoken-English practice.
- Output valid JSON only. No preamble, no markdown fences.

EXAMPLES
Transcript: Myself Priya Sharma. I completed BCom from Pune University last year and I am looking for a sales role.
JSON: {"praise":"You said “I completed BCom from Pune University.”","one_upgrade":"Start with “I’m Priya” instead of “Myself Priya”.","could_have_said":"I’m Priya Sharma. I completed my BCom from Pune University last year, and I’m looking for a sales role.","resay_sentence":"I’m Priya Sharma and I completed BCom in Pune.","used_target_words":["completed"],"confidence_score":4}

Transcript: In my internship the deadline was very tight. I did the needful and coordinated with the team so we could submit on time.
JSON: {"praise":"You said you “coordinated with the team” on a tight deadline.","one_upgrade":"Name the one task you personally owned that week.","could_have_said":"During my internship the deadline was very tight. I did the needful and coordinated with the team so we could submit on time.","resay_sentence":"The deadline was tight, so I coordinated with the team.","used_target_words":["deadline","coordinated"],"confidence_score":5}

Transcript: I am from Nagpur only. The orange is famous and my friends are all staying there so I miss the food.
JSON: {"praise":"You tied Nagpur to “the food” and friends.","one_upgrade":"Name one place you would take a visitor.","could_have_said":"I’m from Nagpur. It’s famous for oranges, and I miss the food and my friends who still live there.","resay_sentence":"I’m from Nagpur, and I love the food there.","used_target_words":["famous"],"confidence_score":4}`;

function abortAfter(ms: number) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function respond(body: Record<string, unknown>, status = 200) {
  return json({ ...body, prompt_version: PROMPT_VERSION }, status);
}

function contentWords(text: string) {
  return String(text || "").toLowerCase().match(/[a-z0-9']+/g)?.filter((w) => w.length >= 3 && !STOPWORDS.has(w)) ?? [];
}

function clipResay(text: string) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 8 && words.length <= 14) return words.join(" ");
  if (words.length > 14) return words.slice(0, 14).join(" ");
  const pad = "I can say a little more about this.".split(/\s+/);
  return [...words, ...pad].slice(0, 8).join(" ");
}

function quotedPraise(transcript: string, typed: boolean) {
  const snippet = String(transcript || "").trim().split(/\s+/).filter(Boolean).slice(0, 8).join(" ");
  if (!snippet) return SAFE.praise;
  return typed ? `You wrote “${snippet}.”` : `You said “${snippet}.”`;
}

function praiseOverlapsTranscript(praise: string, transcript: string) {
  const t = new Set(contentWords(transcript));
  if (!t.size) return true;
  return contentWords(praise).some((w) => t.has(w));
}

function fallbackFromTranscript(text: string, typed: boolean) {
  const trimmed = text.trim();
  if (!trimmed) return SAFE;
  const first = (trimmed.match(/^[^.!?]+[.!?]?/) || [trimmed])[0].trim();
  return {
    praise: quotedPraise(trimmed, typed),
    one_upgrade: "Next time, add one more sentence about why.",
    could_have_said: trimmed,
    resay_sentence: clipResay(first),
    used_target_words: [] as string[],
    confidence_score: 3,
  };
}

function ensureQuotedPraise(parsed: Record<string, unknown>, transcript: string, typed: boolean) {
  if (!String(transcript || "").trim()) return;
  if (praiseOverlapsTranscript(String(parsed.praise || ""), transcript)) return;
  parsed.praise = quotedPraise(transcript, typed);
}

function parseModelJson(text: string) {
  const stripped = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(stripped); } catch { /* extract object */ }
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function clipResayFromHint(hint: string) {
  const words = String(hint || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 8 && words.length <= 14) return words.join(" ");
  if (words.length > 14) return words.slice(0, 14).join(" ");
  const pad = "Start with I would say then add one detail.".split(/\s+/);
  return [...words, ...pad].slice(0, 8).join(" ");
}

function hintReply(hint: string) {
  const text = String(hint || "").trim() || "Take your time. Start with I would say and build from there.";
  return {
    praise: "You opened the mic — that already counts.",
    one_upgrade: text,
    could_have_said: text,
    resay_sentence: clipResayFromHint(text),
    used_target_words: [] as string[],
    confidence_score: 2,
  };
}

Deno.serve(async (req) => {
  console.log("feedback request", req.method, req.url);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const incoming = await req.clone().json();
  console.log("feedback called, body:", JSON.stringify(incoming));
  const { transcript = "", question, hint = "", level, target_words = [], recent_upgrades = [], input_mode = "spoken" } = incoming;
  const typed = input_mode === "typed";
  if (typed) console.log("typed transcript received:", transcript);
  const clean = String(transcript ?? "").slice(0, 1500).replace(/\b[\w.+-]+@[\w-]+\.\w+\b|\b\d{10}\b/g, "[removed]");
  if (/ignore (all )?previous|system prompt|jailbreak/i.test(clean)) {
    const reason = "input_guard";
    console.error("RETURNING SAFE DEFAULT, reason:", reason);
    return respond(SAFE);
  }

  const spokenEmpty = !typed && !clean.trim();
  if (spokenEmpty) {
    console.log("silence/empty spoken — returning question hint");
    return respond(hintReply(String(hint || "")));
  }

  const inputNote = typed
    ? "The learner TYPED this answer. It is not speech recognition. Treat every word as what they meant. Rewrite their sentences to sound more spoken and confident. Do not invent a generic model answer. Do not treat spelling or punctuation as STT glitches."
    : "A transcript from speech recognition. It may have recognition errors, missing punctuation, Indian-English phrasing. Treat transcription glitches as glitches, never as learner errors.";

  const system = [
    { type: "text", text: STATIC_PROMPT, cache_control: { type: "ephemeral" } },
    {
      type: "text",
      text: `CONTEXT
- Question asked: ${question}
- Learner level: ${level}
- Words we hoped to hear: ${target_words.join(", ")}
- Tips already given recently (do not repeat): ${recent_upgrades.join(" | ")}
- Input mode: ${typed ? "typed" : "spoken"}

WHAT YOU RECEIVE
${inputNote}`,
    },
  ];

  const started = Date.now();
  let parsed = null;
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    const remaining = CLAUDE_BUDGET_MS - (Date.now() - started);
    if (remaining < 800) break;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 400,
          system,
          messages: [{ role: "user", content: `${typed ? "Typed answer" : "Transcript"}: """${clean}"""${attempt ? "\nOutput valid JSON only." : ""}` }],
        }),
        signal: abortAfter(remaining),
      });
      const raw = await r.json();
      console.log("anthropic response", { attempt, status: r.status, raw });
      const text = raw.content?.[0]?.text ?? "";
      parsed = parseModelJson(text);
      if (!parsed) {
        console.error("feedback JSON.parse failed", { attempt, text });
        console.error("RETURNING SAFE DEFAULT, reason:", attempt === 0 ? "parse_fail_1" : "parse_fail_2");
      }
    } catch (err) {
      console.error("anthropic call failed", { attempt, err: String(err) });
      break;
    }
  }
  if (!parsed) {
    const reason = "claude_timeout_or_parse";
    console.error("RETURNING FAST FALLBACK, reason:", reason);
    return respond(fallbackFromTranscript(clean, typed));
  }

  for (const k of ["praise", "one_upgrade", "resay_sentence", "could_have_said"]) {
    if (BANNED.test(parsed[k] ?? "")) {
      const reason = "banned_word";
      console.error("RETURNING SAFE DEFAULT, reason:", reason);
      if (k === "praise") parsed[k] = quotedPraise(clean, typed);
      else if (typed && k === "could_have_said") parsed[k] = clean.trim() || SAFE.could_have_said;
      else parsed[k] = SAFE[k as keyof typeof SAFE];
    }
  }
  if (typeof parsed.could_have_said !== "string" || !parsed.could_have_said.trim()) {
    parsed.could_have_said = parsed.resay_sentence || (typed ? clean.trim() : "") || SAFE.could_have_said;
  }
  if (typeof parsed.resay_sentence !== "string" || !parsed.resay_sentence.trim()) {
    parsed.resay_sentence = clipResay(clean);
  } else {
    const n = String(parsed.resay_sentence).trim().split(/\s+/).filter(Boolean).length;
    if (n < 8 || n > 14) parsed.resay_sentence = clipResay(parsed.resay_sentence);
  }
  ensureQuotedPraise(parsed, clean, typed);
  parsed.confidence_score = Math.min(5, Math.max(1, Number(parsed.confidence_score) || 3));
  return respond(parsed);
});
