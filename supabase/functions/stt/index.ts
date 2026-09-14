// Verify field names against Sarvam's current docs before first run — API shapes change.
export {};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fileName(audio: File) {
  const type = audio.type || "";
  if (type.includes("mp4") || type.includes("m4a") || type.includes("aac")) return "answer.m4a";
  if (type.includes("mpeg") || type.includes("mp3")) return "answer.mp3";
  if (type.includes("wav")) return "answer.wav";
  if (type.includes("ogg")) return "answer.ogg";
  return "answer.webm";
}

function transcriptOf(data: Record<string, unknown> | null | undefined) {
  if (!data) return "";
  return String(data.transcript || data.translated_text || "").trim();
}

async function sarvamPost(url: string, audio: File, fields: Record<string, string>) {
  const out = new FormData();
  out.append("file", audio, fileName(audio));
  for (const [key, value] of Object.entries(fields)) out.append(key, value);
  const r = await fetch(url, {
    method: "POST",
    headers: { "api-subscription-key": Deno.env.get("SARVAM_API_KEY")! },
    body: out,
  });
  let data: Record<string, unknown> = {};
  try {
    data = await r.json();
  } catch {
    data = {};
  }
  return { ok: r.ok, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const form = await req.formData();
  const audio = form.get("file") as File | null;
  if (!audio) return json({ transcript: "" }, 400);

  const key = Deno.env.get("SARVAM_API_KEY");
  if (!key) return json({ transcript: "", error: "missing_key" }, 500);

  // Translate + auto-detect: Indian English, Hindi, Bengali, and mixes → English text.
  let { ok, data } = await sarvamPost("https://api.sarvam.ai/speech-to-text", audio, {
    model: "saaras:v3",
    mode: "translate",
    language_code: "unknown",
  });
  let transcript = transcriptOf(data);
  let language_code = data.language_code ?? null;

  // Short English answers often fail LID — retry locked to Indian English.
  if (!transcript) {
    ({ ok, data } = await sarvamPost("https://api.sarvam.ai/speech-to-text", audio, {
      model: "saaras:v3",
      mode: "transcribe",
      language_code: "en-IN",
    }));
    transcript = transcriptOf(data);
    language_code = data.language_code ?? language_code;
  }

  // Older translate endpoint as last resort (Hindi/Bengali → English).
  if (!transcript) {
    ({ ok, data } = await sarvamPost("https://api.sarvam.ai/speech-to-text-translate", audio, {
      model: "saaras:v2.5",
    }));
    transcript = transcriptOf(data);
    language_code = data.language_code ?? language_code;
  }

  return json({ transcript, language_code }, transcript || ok ? 200 : 502);
});
