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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const form = await req.formData();
  const audio = form.get("file") as File | null;
  if (!audio) return json({ transcript: "" }, 400);

  const out = new FormData();
  out.append("file", audio, "answer.webm");
  out.append("model", "saarika:v2.5");
  out.append("language_code", "en-IN");

  const r = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: { "api-subscription-key": Deno.env.get("SARVAM_API_KEY")! },
    body: out,
  });
  const data = await r.json();
  return json({ transcript: data.transcript ?? "" }, r.ok ? 200 : r.status);
});
