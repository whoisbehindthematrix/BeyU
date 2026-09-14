#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..");

loadDotEnv(path.join(repoRoot, ".env"));
loadDotEnv(path.join(appRoot, ".env"));
loadDotEnv(path.join(process.cwd(), ".env"));

const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_ANON_KEY || process.env.ANON_KEY || "";

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_ANON_KEY in the environment or a .env file.");
  process.exit(1);
}

const dest = path.join(appRoot, "js", "config.js");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(
  dest,
  `export const SUPABASE_URL = ${JSON.stringify(url)};\nexport const SUPABASE_ANON_KEY = ${JSON.stringify(key)};\n`,
);
console.error(`Wrote ${path.relative(process.cwd(), dest)}`);
