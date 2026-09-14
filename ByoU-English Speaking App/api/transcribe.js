export const config = { runtime: "edge" };

async function transcribeWithSarvam(file) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error("missing_key");

  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  const filename = name.endsWith(".wav") || type.includes("wav")
    ? "answer.wav"
    : name.endsWith(".webm") || type.includes("webm")
      ? "answer.webm"
      : name.endsWith(".mp3") || type.includes("mpeg")
        ? "answer.mp3"
        : "answer.m4a";

  const out = new FormData();
  out.append("file", file, filename);
  out.append("model", "saaras:v3");
  out.append("mode", "transcribe");
  out.append("language_code", "en-IN");

  const r = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: { "api-subscription-key": key },
    body: out,
  });
  let data = {};
  try { data = await r.json(); } catch { data = {}; }
  if (!r.ok) throw new Error("sarvam_failed");
  return String(data.transcript || data.translated_text || "").trim();
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") {
    return Response.json({ transcript: "", error: "method" }, { status: 405 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file) return Response.json({ transcript: "" }, { status: 400 });
    const transcript = await transcribeWithSarvam(file);
    return Response.json({ transcript });
  } catch (err) {
    const status = err?.message === "missing_key" ? 500 : 502;
    return Response.json({ transcript: "", error: "transcribe_failed" }, { status });
  }
}
