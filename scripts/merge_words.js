#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(DATA_DIR, "words.csv");
const HEADER = ["word", "meaning", "example", "ipa", "level", "category"];

function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && next === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => cell !== "")) rows.push(row);
  }
  return rows;
}

function csvField(value) {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function loadSourceFiles() {
  if (!fs.existsSync(DATA_DIR)) fail(`Missing data directory: ${DATA_DIR}`);
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((name) => /^words_.*\.csv$/i.test(name))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => path.join(DATA_DIR, name));
  if (!files.length) fail(`No files matching ${path.join(DATA_DIR, "words_*.csv")}`);
  return files;
}

function rowToRecord(cells, file, line) {
  if (cells.length !== HEADER.length) {
    fail(`${file}:${line} expected ${HEADER.length} columns, got ${cells.length}`);
  }
  const record = {};
  for (let i = 0; i < HEADER.length; i++) {
    record[HEADER[i]] = String(cells[i] ?? "").trim();
  }
  record.word = record.word.toLowerCase();
  return record;
}

function validate(record, file, line) {
  for (const key of HEADER) {
    if (!record[key]) fail(`${file}:${line} empty field: ${key}`);
  }
  if (!/^[1-5]$/.test(record.level)) {
    fail(`${file}:${line} level must be 1-5, got ${JSON.stringify(record.level)}`);
  }
}

function main() {
  const seen = new Set();
  const merged = [];
  const skipped = [];

  for (const file of loadSourceFiles()) {
    const rows = parseCsv(fs.readFileSync(file, "utf8"));
    if (!rows.length) fail(`${file} is empty`);
    const header = rows[0].map((cell) => cell.trim().toLowerCase());
    if (header.join(",") !== HEADER.join(",")) {
      fail(`${file}:1 expected header ${HEADER.join(",")}, got ${header.join(",")}`);
    }
    for (let i = 1; i < rows.length; i++) {
      const line = i + 1;
      const record = rowToRecord(rows[i], file, line);
      validate(record, file, line);
      if (seen.has(record.word)) {
        skipped.push(record.word);
        continue;
      }
      seen.add(record.word);
      merged.push(record);
    }
  }

  const lines = [
    HEADER.join(","),
    ...merged.map((row) => HEADER.map((key) => csvField(row[key])).join(",")),
  ];
  fs.writeFileSync(OUT_FILE, lines.join("\n") + "\n", "utf8");

  const counts = {};
  for (const row of merged) {
    counts[row.category] = (counts[row.category] || 0) + 1;
  }
  for (const category of Object.keys(counts).sort()) {
    console.log(`${category}: ${counts[category]}`);
  }
  console.log(`total: ${merged.length}`);
  if (skipped.length) console.log(`duplicates skipped: ${skipped.length}`);
}

main();
