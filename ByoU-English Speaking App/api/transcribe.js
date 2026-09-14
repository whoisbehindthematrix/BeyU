export const config = {
  api: { bodyParser: false },
  maxDuration: 30,
};

function json(res, body, status = 200) {
  if (typeof res?.status === "function") {
    return res.status(status).json(body);
  }
  return Response.json(body, { status });
}

async function fileFromRequest(req) {
  if (typeof req.formData === "function") {
    const form = await req.formData();
    return form.get("file");
  }
  const contentType = req.headers["content-type"] || req.headers.get?.("content-type") || "";
  const request = new Request("http://localhost/api/transcribe", {
    method: "POST",
    headers: { "content-type": contentType },
    body: req,
    duplex: "half",
  });
  const form = await request.formData();
  return form.get("file");
}

function fileName(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  if (name.endsWith(".wav") || type.includes("wav")) return "answer.wav";
  if (name.endsWith(".m4a") || type.includes("mp4") || type.includes("m4a") || type.includes("aac")) return "answer.m4a";
  if (name.endsWith(".mp3") || type.includes("mpeg") || type.includes("mp3")) return "answer.mp3";
  if (name.endsWith(".webm") || type.includes("webm")) return "answer.webm";
  return name || "answer.m4a";
}

async function transcribeWithSarvam(file) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error("missing_key");
  const out = new FormData();
  out.append("file", file, fileName(file));
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
  return String(data.transcript || "").trim();
}

export default async function handler(req, res) {
  const method = req.method || "";
  if (method === "OPTIONS") {
    if (typeof res?.status === "function") return res.status(204).end();
    return new Response(null, { status: 204 });
  }
  if (method !== "POST") return json(res, { transcript: "", error: "method" }, 405);

  try {
    const file = await fileFromRequest(req);
    if (!file) return json(res, { transcript: "" }, 400);
    const transcript = await transcribeWithSarvam(file);
    return json(res, { transcript });
  } catch (err) {
    console.error("transcribe failed", err);
    const status = err?.message === "missing_key" ? 500 : 502;
    return json(res, { transcript: "", error: "transcribe_failed" }, status);
  }
}
