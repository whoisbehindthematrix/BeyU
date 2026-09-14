#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const BANNED = /\b(wrong|mistakes?|grammar|grammatical|errors?|incorrect|poor|bad|fail(ed|ure)?)\b/i;
const STOPWORDS = new Set([
  "the", "and", "for", "you", "your", "that", "this", "with", "from", "was", "are",
  "but", "not", "have", "had", "has", "they", "them", "their", "our", "out", "all",
  "very", "just", "like", "then", "than", "into", "about", "what", "when", "who",
]);

const CHECKS = [
  { id: "valid_json", label: "valid JSON", need: "100%", hard: true },
  { id: "banned", label: "banned words", need: "0", hard: true },
  { id: "praise_overlap", label: "praise overlaps transcript", need: "≥90%", hard: true },
  { id: "resay_len", label: "resay_sentence 8–14 words", need: "≥90%", hard: true },
  { id: "upgrade_fresh", label: "one_upgrade not in recent_upgrades", need: "100%", hard: true },
  { id: "p95", label: "p95 latency", need: "<3000ms", hard: true },
];

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = val;
  }
}

const root = path.resolve(__dirname, "..");
loadDotEnv(path.join(root, ".env"));
loadDotEnv(path.join(process.cwd(), ".env"));

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.ANON_KEY || "";
const FEEDBACK_URL = process.env.FEEDBACK_URL || `${SUPABASE_URL}/functions/v1/feedback`;

if (!SUPABASE_URL && !process.env.FEEDBACK_URL) {
  console.error("Set SUPABASE_URL and SUPABASE_ANON_KEY (or FEEDBACK_URL + SUPABASE_ANON_KEY).");
  process.exit(1);
}
if (!ANON_KEY) {
  console.error("Set SUPABASE_ANON_KEY.");
  process.exit(1);
}

function words(text) {
  return String(text || "")
    .toLowerCase()
    .match(/[a-z0-9']+/g) ?? [];
}

function contentWords(text) {
  return words(text).filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function pct(n, d) {
  if (!d) return 0;
  return (100 * n) / d;
}

function p95(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(0.95 * sorted.length) - 1));
  return sorted[idx];
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function loadGolden(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        throw new Error(`golden.jsonl line ${i + 1}: ${err.message}`);
      }
    });
}

async function callFeedback(row) {
  const started = Date.now();
  const res = await fetch(FEEDBACK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transcript: row.transcript,
      question: row.question,
      level: row.level,
      target_words: row.target_words ?? [],
      recent_upgrades: row.recent_upgrades ?? [],
    }),
    signal: AbortSignal.timeout(15000),
  });
  const latency = Date.now() - started;
  const raw = await res.text();
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    data = null;
  }
  return { ok: res.ok, latency, raw, data };
}

function scoreCase(row, result) {
  const out = result.data;
  const valid = !!(out && typeof out === "object"
    && typeof out.praise === "string"
    && typeof out.one_upgrade === "string"
    && typeof out.resay_sentence === "string");

  const fields = valid ? [out.praise, out.one_upgrade, out.resay_sentence] : [result.raw];
  const banned = fields.some((s) => BANNED.test(s || ""));

  const transcriptSet = new Set(contentWords(row.transcript));
  const praiseSet = new Set(contentWords(valid ? out.praise : ""));
  const overlap = [...praiseSet].some((w) => transcriptSet.has(w));

  const resayWords = valid ? wordCount(out.resay_sentence) : 0;
  const resayOk = resayWords >= 8 && resayWords <= 14;

  const recents = (row.recent_upgrades ?? []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  const upgrade = valid ? String(out.one_upgrade).trim().toLowerCase() : "";
  const fresh = !upgrade || !recents.includes(upgrade);

  return { valid, banned, overlap, resayOk, fresh, latency: result.latency, out };
}

async function main() {
  const goldenPath = path.join(__dirname, "golden.jsonl");
  const cases = loadGolden(goldenPath);
  if (!cases.length) {
    console.error("golden.jsonl is empty.");
    process.exit(1);
  }

  console.error(`Calling ${FEEDBACK_URL}  (${cases.length} cases)`);
  const scored = [];
  for (let i = 0; i < cases.length; i++) {
    const row = cases[i];
    try {
      const result = await callFeedback(row);
      scored.push(scoreCase(row, result));
    } catch (err) {
      scored.push({
        valid: false,
        banned: true,
        overlap: false,
        resayOk: false,
        fresh: false,
        latency: 15000,
        error: err.message,
      });
    }
    const s = scored[i];
    const mark = s.valid && !s.banned && s.overlap && s.resayOk && s.fresh ? "ok" : "fail";
    console.error(`  ${i + 1}/${cases.length}  ${mark}  ${s.latency}ms${s.error ? `  ${s.error}` : ""}`);
  }

  const n = scored.length;
  const validPct = pct(scored.filter((s) => s.valid).length, n);
  const bannedCount = scored.filter((s) => s.banned).length;
  const overlapPct = pct(scored.filter((s) => s.overlap).length, n);
  const resayPct = pct(scored.filter((s) => s.resayOk).length, n);
  const freshPct = pct(scored.filter((s) => s.fresh).length, n);
  const latencyP95 = p95(scored.map((s) => s.latency));

  const results = {
    valid_json: { got: `${validPct.toFixed(0)}%`, pass: validPct >= 100 },
    banned: { got: String(bannedCount), pass: bannedCount === 0 },
    praise_overlap: { got: `${overlapPct.toFixed(0)}%`, pass: overlapPct >= 90 },
    resay_len: { got: `${resayPct.toFixed(0)}%`, pass: resayPct >= 90 },
    upgrade_fresh: { got: `${freshPct.toFixed(0)}%`, pass: freshPct >= 100 },
    p95: { got: `${Math.round(latencyP95)}ms`, pass: latencyP95 < 3000 },
  };

  console.log("");
  console.log(`${pad("check", 38)}${pad("need", 10)}${pad("got", 10)}result`);
  console.log("-".repeat(64));
  let failed = 0;
  for (const check of CHECKS) {
    const r = results[check.id];
    const flag = r.pass ? "PASS" : "FAIL";
    if (!r.pass && check.hard) failed += 1;
    console.log(`${pad(check.label, 38)}${pad(check.need, 10)}${pad(r.got, 10)}${flag}`);
  }
  console.log("-".repeat(64));
  console.log(failed ? `${failed} hard failure(s)` : "all hard checks passed");
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
