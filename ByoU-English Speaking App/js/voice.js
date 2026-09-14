import { store } from "./session.js";
import { track } from "./track.js";
import { supabase } from "./supabase.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

let renderPractice = () => {};
let submitAnswer = () => {};
let patchLiveTranscript = () => false;
let patchRecordingTimer = () => false;

let mediaRecorder = null;
let chunks = [];
let recorderMime = "";
let recStream = null;
let recordingStart = Promise.resolve();
let recAudioCtx = null;
let recProcessor = null;
let pcmChunks = [];
let pcmSampleRate = 16000;

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function extForMime(mime) {
  const type = String(mime || "").toLowerCase();
  if (type.includes("wav")) return "wav";
  if (type.includes("mp4") || type.includes("m4a") || type.includes("aac")) return "m4a";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  return "webm";
}

function attachPcm(stream) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    recAudioCtx = new AC();
    recAudioCtx.resume?.();
    pcmSampleRate = recAudioCtx.sampleRate || 44100;
    pcmChunks = [];
    const src = recAudioCtx.createMediaStreamSource(stream);
    const makeProcessor = recAudioCtx.createScriptProcessor || recAudioCtx.createJavaScriptNode;
    if (!makeProcessor) return;
    recProcessor = makeProcessor.call(recAudioCtx, 4096, 1, 1);
    recProcessor.onaudioprocess = (e) => {
      pcmChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };
    src.connect(recProcessor);
    const mute = recAudioCtx.createGain();
    mute.gain.value = 0;
    recProcessor.connect(mute);
    mute.connect(recAudioCtx.destination);
  } catch (err) {
    console.error(err);
  }
}

function encodeWav(float32, sampleRate) {
  const pcm = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + bytes);
  const view = new DataView(buffer);
  const ascii = (offset, text) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + bytes, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, bytes, true);
  let offset = 44;
  for (let i = 0; i < pcm.length; i++, offset += 2) view.setInt16(offset, pcm[i], true);
  return new Blob([buffer], { type: "audio/wav" });
}

function downsample(input, fromRate, toRate) {
  if (!input?.length || fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outLen = Math.max(1, Math.round(input.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio) || start + 1);
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

function wavFromPcm() {
  if (!pcmChunks.length) return null;
  let total = 0;
  for (const part of pcmChunks) total += part.length;
  if (total < 1600) return null;
  const merged = new Float32Array(total);
  let offset = 0;
  for (const part of pcmChunks) {
    merged.set(part, offset);
    offset += part.length;
  }
  return encodeWav(downsample(merged, pcmSampleRate, 16000), 16000);
}

function releaseCapture() {
  try { recProcessor?.disconnect(); } catch { /* ignore */ }
  try { recAudioCtx?.close(); } catch { /* ignore */ }
  recProcessor = null;
  recAudioCtx = null;
}

function releaseTracks() {
  recStream?.getTracks().forEach((t) => t.stop());
  recStream = null;
  mediaRecorder?.stream?.getTracks().forEach((t) => t.stop());
  releaseCapture();
}

export async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new Error("recording_unsupported");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recStream = stream;
  chunks = [];
  pcmChunks = [];
  attachPcm(stream);
  try {
    const useWebm = !isIOS() && MediaRecorder.isTypeSupported("audio/webm");
    mediaRecorder = useWebm
      ? new MediaRecorder(stream, { mimeType: "audio/webm" })
      : new MediaRecorder(stream);
    recorderMime = mediaRecorder.mimeType || (useWebm ? "audio/webm" : "");
    mediaRecorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    const slice = isIOS() ? 1000 : 250;
    try { mediaRecorder.start(slice); } catch { mediaRecorder.start(); }
    track("mic_permission", { result: "granted" });
    track("recording_started");
  } catch (err) {
    stream.getTracks().forEach((t) => t.stop());
    recStream = null;
    mediaRecorder = null;
    throw err;
  }
}

export function stopRecording() {
  return new Promise((resolve) => {
    const rec = mediaRecorder;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const mime = rec?.mimeType || recorderMime || "audio/webm";
      recorderMime = mime;
      const recorded = new Blob(chunks, { type: mime.split(";")[0] || mime });
      const wav = wavFromPcm();
      releaseTracks();
      mediaRecorder = null;
      resolve(recorded.size >= 1000 ? recorded : (wav && wav.size > 1000 ? wav : recorded));
    };
    if (!rec || rec.state === "inactive") {
      finish();
      return;
    }
    rec.onstop = () => finish();
    try { rec.requestData(); } catch { /* ignore */ }
    try { rec.stop(); } catch { finish(); return; }
    setTimeout(finish, 2500);
  });
}

function stopRecordingSafe() {
  return Promise.resolve(recordingStart)
    .catch(() => {})
    .then(() => stopRecording())
    .catch(() => new Blob([], { type: recorderMime || "audio/webm" }));
}

function fileFor(blob) {
  const mime = blob.type || recorderMime || "audio/webm";
  return { mime, filename: `answer.${extForMime(mime)}` };
}

async function transcribeViaVercel(blob) {
  const { filename } = fileFor(blob);
  const fd = new FormData();
  fd.append("file", blob, filename);
  const res = await fetch("/api/transcribe", { method: "POST", body: fd });
  if (!res.ok) return "";
  const data = await res.json();
  return String(data?.transcript || "").trim();
}

async function transcribeViaSupabase(blob) {
  const { filename } = fileFor(blob);
  const fd = new FormData();
  fd.append("file", blob, filename);
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token || SUPABASE_ANON_KEY;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/stt`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: fd,
  });
  if (!res.ok) return "";
  const data = await res.json();
  return String(data?.transcript || data?.translated_text || "").trim();
}

export async function transcribeAudio(blob) {
  if (!blob?.size) throw new Error("empty_audio");
  let text = "";
  try { text = await transcribeViaVercel(blob); } catch (err) { console.error(err); }
  if (text) return text;
  try { text = await transcribeViaSupabase(blob); } catch (err) { console.error(err); }
  if (text) return text;
  throw new Error("empty_transcript");
}

export async function uploadAnswerAudio(blob, userId, sessionId, questionId) {
  const ext = extForMime(blob?.type || recorderMime);
  const path = `${userId}/${sessionId}/${questionId}.${ext}`;
  const { error } = await supabase.storage.from("answers").upload(path, blob, {
    contentType: blob?.type || "audio/webm",
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export function wireVoice(deps) {
  renderPractice = deps.renderPractice;
  submitAnswer = deps.submitAnswer;
  patchLiveTranscript = deps.patchLiveTranscript || patchLiveTranscript;
  patchRecordingTimer = deps.patchRecordingTimer || patchRecordingTimer;
}

export class SpeechController {
  constructor() {
    this.synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  }
  speak(text, onEnd) {
    if (!this.synth) return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    const voices = this.synth.getVoices();
    const enInVoice = voices.find((v) => v.lang === "en-IN" || v.lang.startsWith("en"));
    if (enInVoice) utterance.voice = enInVoice;
    if (onEnd) utterance.onend = onEnd;
    this.synth.speak(utterance);
  }
}

export const speechController = new SpeechController();

export function stopTimer() {
  if (store.practice.timer) { clearInterval(store.practice.timer); store.practice.timer = null; }
}

export function startTimer() {
  store.practice.elapsedSec = 0;
  store.practice.timer = setInterval(() => {
    store.practice.elapsedSec += 1;
    patchRecordingTimer();
  }, 1000);
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function failHearRetry() {
  store.practice.sttFailed = true;
  store.practice.listeningFlag = false;
  store.practice.micState = "idle";
  store.practice.transcript = "";
  store.practice.liveText = "";
  store.practice.transcriptRef = "";
  renderPractice();
}

export function startListening() {
  store.practice.sttFailed = false;
  store.practice.transcript = "";
  store.practice.liveText = "";
  store.practice.transcriptRef = "";
  store.practice.hearingVoice = false;
  store.practice.micState = "listening";
  store.practice.listeningFlag = true;
  store.practice.feedback = null;
  store.practice.audioBlob = null;
  store.practice.silenceTimeout = false;
  try { speechController.synth?.cancel(); } catch { /* ignore */ }
  recordingStart = startRecording();
  startTimer();
  renderPractice();
  recordingStart.catch((err) => {
    console.error(err);
    track("mic_permission", { result: "blocked" });
    const blocked = err?.name === "NotAllowedError" || err?.name === "NotFoundError" || err?.name === "SecurityError";
    store.practice.listeningFlag = false;
    stopTimer();
    if (blocked) {
      store.practice.typingMode = true;
      store.practice.micState = "idle";
      renderPractice();
      return;
    }
    failHearRetry();
  });
}

export async function stopListening() {
  if (store.practice.micState === "processing") return null;
  store.practice.listeningFlag = false;
  stopTimer();
  track("recording_ended", { duration_sec: store.practice.elapsedSec });
  store.practice.micState = "processing";
  renderPractice();
  await Promise.resolve(recordingStart).catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 350));
  const blob = await stopRecordingSafe();
  store.practice.audioBlob = blob;
  try {
    const transcript = await transcribeAudio(blob);
    store.practice.emptySttCount = 0;
    const result = { transcript, engine: "sarvam" };
    track("stt_result", { engine: "sarvam", empty: false, chars: transcript.length });
    submitAnswer(result);
    return result;
  } catch (err) {
    console.error(err);
    track("stt_result", { engine: "sarvam", empty: true, chars: 0 });
    failHearRetry();
    return { transcript: "", engine: "sarvam" };
  }
}

export function handleTypedSubmit() {
  const text = store.practice.typedText.trim();
  if (!text) return;
  store.practice.transcript = text;
  store.practice.typedText = "";
  store.practice.emptySttCount = 0;
  const result = { transcript: text, engine: "typed" };
  submitAnswer(result);
  return result;
}
