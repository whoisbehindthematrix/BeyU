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
const PROMPT_VERSION = "v5";
const SYSTEM_PROMPT = `You are ByoU, a warm English speaking coach for Indian job seekers who can read and write English but freeze when speaking. Your only job is to make the learner want to speak again tomorrow.

CONTEXT
- Question asked: {{question}}
- Learner level: {{level}}
- Words we hoped to hear: {{target_words}}
- Tips already given recently (do not repeat): {{recent_upgrades}}
- Input mode: {{input_mode}}

WHAT YOU RECEIVE
{{input_note}}

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
- Praise must be specific to what they said. "Good job" is not praise.
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function respond(body: Record<string, unknown>, status = 200) {
  return json({ ...body, prompt_version: PROMPT_VERSION }, status);
}

function fallbackFromTyped(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return SAFE;
  const words = trimmed.split(/\s+/);
  const quoted = words.slice(0, 10).join(" ");
  const first = (trimmed.match(/^[^.!?]+[.!?]?/) || [trimmed])[0].trim();
  const resay = first.split(/\s+/).slice(0, 14).join(" ");
  return {
    praise: `You wrote “${quoted}.”`,
    one_upgrade: "Next time, add one more sentence about why.",
    could_have_said: trimmed,
    resay_sentence: resay,
    used_target_words: [] as string[],
    confidence_score: 3,
  };
}

function parseModelJson(text: string) {
  const stripped = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(stripped); } catch { /* extract object */ }
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

Deno.serve(async (req) => {
  console.log("feedback request", req.method, req.url);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const incoming = await req.clone().json();
  console.log("feedback called, body:", JSON.stringify(incoming));
  const { transcript = "", question, level, target_words = [], recent_upgrades = [], input_mode = "spoken" } = incoming;
  const typed = input_mode === "typed";
  if (typed) console.log("typed transcript received:", transcript);
  const clean = String(transcript ?? "").slice(0, 1500).replace(/\b[\w.+-]+@[\w-]+\.\w+\b|\b\d{10}\b/g, "[removed]");
  if (/ignore (all )?previous|system prompt|jailbreak/i.test(clean)) {
    const reason = "input_guard";
    console.error("RETURNING SAFE DEFAULT, reason:", reason);
    return respond(SAFE);
  }

  const inputNote = typed
    ? "The learner TYPED this answer. It is not speech recognition. Treat every word as what they meant. Rewrite their sentences to sound more spoken and confident. Do not invent a generic model answer. Do not treat spelling or punctuation as STT glitches."
    : "A transcript from speech recognition. It may have recognition errors, missing punctuation, Indian-English phrasing. Treat transcription glitches as glitches, never as learner errors.";

  const system = SYSTEM_PROMPT.replace("{{question}}", question).replace("{{level}}", level)
    .replace("{{target_words}}", target_words.join(", ")).replace("{{recent_upgrades}}", recent_upgrades.join(" | "))
    .replace("{{input_mode}}", typed ? "typed" : "spoken")
    .replace("{{input_note}}", inputNote);

  let parsed = null;
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 700,
        system,
        messages: [{ role: "user", content: `${typed ? "Typed answer" : "Transcript"}: """${clean}"""${attempt ? "\nOutput valid JSON only." : ""}` }],
      }),
    });
    const raw = await r.json();
    console.log("anthropic response", { attempt, status: r.status, raw });
    const text = raw.content?.[0]?.text ?? "";
    parsed = parseModelJson(text);
    if (!parsed) {
      console.error("feedback JSON.parse failed", { attempt, text });
      const reason = attempt === 0 ? "parse_fail_1" : "parse_fail_2";
      console.error("RETURNING SAFE DEFAULT, reason:", reason);
      if (attempt === 1) return respond(typed ? fallbackFromTyped(clean) : SAFE);
    }
  }
  if (!parsed) {
    const reason = "parse_fail_2";
    console.error("RETURNING SAFE DEFAULT, reason:", reason);
    return respond(typed ? fallbackFromTyped(clean) : SAFE);
  }

  for (const k of ["praise", "one_upgrade", "resay_sentence", "could_have_said"]) {
    if (BANNED.test(parsed[k] ?? "")) {
      const reason = "banned_word";
      console.error("RETURNING SAFE DEFAULT, reason:", reason);
      parsed[k] = typed && k === "could_have_said"
        ? (clean.trim() || SAFE.could_have_said)
        : SAFE[k as keyof typeof SAFE];
    }
  }
  if (typeof parsed.could_have_said !== "string" || !parsed.could_have_said.trim()) {
    parsed.could_have_said = parsed.resay_sentence || (typed ? clean.trim() : "") || SAFE.could_have_said;
  }
  parsed.confidence_score = Math.min(5, Math.max(1, Number(parsed.confidence_score) || 3));
  return respond(parsed);
});
