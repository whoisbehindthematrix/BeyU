import { store } from "./session.js";
import { track } from "./track.js";
import { supabase } from "./supabase.js";

let renderPractice = () => {};
let submitAnswer = () => {};
let patchLiveTranscript = () => false;
let patchRecordingTimer = () => false;

let mediaRecorder = null;
let chunks = [];
let recorderMime = "";
let recStream = null;
let recordingStart = Promise.resolve();

function extForMime(mime) {
  const type = String(mime || "").toLowerCase();
  if (type.includes("wav")) return "wav";
  if (type.includes("mp4") || type.includes("m4a") || type.includes("aac")) return "m4a";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  return "webm";
}

function releaseTracks() {
  recStream?.getTracks().forEach((t) => t.stop());
  recStream = null;
  mediaRecorder?.stream?.getTracks().forEach((t) => t.stop());
}

export async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new Error("recording_unsupported");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recStream = stream;
  chunks = [];
  try {
    const useWebm = MediaRecorder.isTypeSupported("audio/webm");
    mediaRecorder = useWebm
      ? new MediaRecorder(stream, { mimeType: "audio/webm" })
      : new MediaRecorder(stream);
    recorderMime = mediaRecorder.mimeType || (useWebm ? "audio/webm" : "");
    mediaRecorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    try { mediaRecorder.start(250); } catch { mediaRecorder.start(); }
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
      const blob = new Blob(chunks, { type: mime.split(";")[0] || mime });
      releaseTracks();
      mediaRecorder = null;
      resolve(blob);
    };
    if (!rec || rec.state === "inactive") {
      finish();
      return;
    }
    rec.onstop = () => finish();
    try { rec.requestData(); } catch { /* ignore */ }
    try { rec.stop(); } catch { finish(); return; }
    setTimeout(finish, 2000);
  });
}

function stopRecordingSafe() {
  return Promise.resolve(recordingStart)
    .catch(() => {})
    .then(() => stopRecording())
    .catch(() => new Blob([], { type: recorderMime || "audio/webm" }));
}

export async function transcribeAudio(blob) {
  if (!blob?.size) throw new Error("empty_audio");
  const mime = blob.type || recorderMime || "audio/webm";
  const fd = new FormData();
  fd.append("file", blob, `answer.${extForMime(mime)}`);
  const res = await fetch("/api/transcribe", { method: "POST", body: fd });
  if (!res.ok) throw new Error("transcribe_failed");
  const data = await res.json();
  const transcript = String(data?.transcript || "").trim();
  if (!transcript) throw new Error("empty_transcript");
  return transcript;
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
  startTimer();
  renderPractice();
  recordingStart = startRecording().catch((err) => {
    console.error(err);
    track("mic_permission", { result: "blocked" });
    store.practice.typingMode = true;
    store.practice.listeningFlag = false;
    store.practice.micState = "idle";
    stopTimer();
    renderPractice();
  });
}

export async function stopListening() {
  if (store.practice.micState === "processing") return null;
  store.practice.listeningFlag = false;
  stopTimer();
  track("recording_ended", { duration_sec: store.practice.elapsedSec });
  store.practice.micState = "processing";
  renderPractice();
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
