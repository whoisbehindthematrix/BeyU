#!/usr/bin/env node
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..");
const PORT = Number(process.env.PORT || 5500);
const UPSTREAM = process.env.TRANSCRIBE_URL || "https://bey-u.vercel.app/api/transcribe";

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

loadDotEnv(path.join(repoRoot, ".env"));
loadDotEnv(path.join(appRoot, ".env"));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function filenameFor(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  if (name.endsWith(".wav") || type.includes("wav")) return "answer.wav";
  if (name.endsWith(".webm") || type.includes("webm")) return "answer.webm";
  if (name.endsWith(".mp3") || type.includes("mpeg")) return "answer.mp3";
  return "answer.m4a";
}

async function transcribeWithSarvam(file) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return null;
  const out = new FormData();
  out.append("file", file, filenameFor(file));
  out.append("model", "saaras:v3");
  out.append("mode", "transcribe");
  out.append("language_code", "en-IN");
  const r = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: { "api-subscription-key": key },
    body: out,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("sarvam_failed");
  return String(data.transcript || data.translated_text || "").trim();
}

async function handleFeedback(req, res) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const incoming = new Request("http://local/api/feedback", {
    method: "POST",
    headers: { "content-type": req.headers["content-type"] || "application/json" },
    body: Buffer.concat(chunks),
  });
  try {
    const { default: handler } = await import("../api/feedback.js");
    const out = await handler(incoming);
    const text = await out.text();
    res.writeHead(out.status, { "content-type": out.headers.get("content-type") || "application/json" });
    res.end(text);
  } catch (err) {
    console.error(err);
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "feedback_failed" }));
  }
}

async function handleTranscribe(req, res) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const contentType = req.headers["content-type"] || "application/octet-stream";

  try {
    if (process.env.SARVAM_API_KEY) {
      const incoming = new Request("http://local/api/transcribe", {
        method: "POST",
        headers: { "content-type": contentType },
        body,
      });
      const form = await incoming.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ transcript: "", error: "missing_file" }));
        return;
      }
      const transcript = await transcribeWithSarvam(file);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ transcript: transcript || "" }));
      return;
    }

    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "content-type": contentType },
      body,
    });
    const text = await upstream.text();
    res.writeHead(upstream.status, { "content-type": upstream.headers.get("content-type") || "application/json" });
    res.end(text);
  } catch (err) {
    console.error(err);
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ transcript: "", error: "transcribe_failed" }));
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(appRoot, rel));
  if (!file.startsWith(appRoot)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "content-type": MIME[ext] || "application/octet-stream",
      "cache-control": ext === ".js" || ext === ".html" || ext === ".css" ? "no-store" : "public, max-age=60",
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const pathname = req.url.split("?")[0];
  if (req.method === "POST" && pathname === "/api/transcribe") {
    handleTranscribe(req, res);
    return;
  }
  if (req.method === "POST" && pathname === "/api/feedback") {
    handleFeedback(req, res);
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end("Method not allowed");
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`ByoU local → http://127.0.0.1:${PORT}/`);
});
