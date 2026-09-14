import { store } from "./session.js";
import { track } from "./track.js";
import { supabase } from "./supabase.js";

let renderPractice = () => {};
let submitAnswer = () => {};
let patchLiveTranscript = () => false;
let patchRecordingTimer = () => false;

let mediaRecorder = null;
let chunks = [];
let recorderMime = "audio/webm";
let recordingStart = Promise.resolve();

function pickRecorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

function releaseTracks(rec) {
  rec?.stream?.getTracks().forEach((t) => t.stop());
}

export async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  try {
    chunks = [];
    recorderMime = pickRecorderMime();
    mediaRecorder = recorderMime
      ? new MediaRecorder(stream, { mimeType: recorderMime })
      : new MediaRecorder(stream);
    recorderMime = mediaRecorder.mimeType || recorderMime || "audio/webm";
    mediaRecorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    mediaRecorder.start();
  } catch (err) {
    stream.getTracks().forEach((t) => t.stop());
    mediaRecorder = null;
    throw err;
  }
}

export function stopRecording() {
  return new Promise((resolve) => {
    const rec = mediaRecorder;
    const mime = rec?.mimeType || recorderMime || "audio/webm";
    if (!rec || rec.state === "inactive") {
      releaseTracks(rec);
      mediaRecorder = null;
      resolve(new Blob(chunks, { type: mime }));
      return;
    }
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
    try { rec.stop(); } catch { /* already stopped */ }
    rec.stream.getTracks().forEach((t) => t.stop());
    mediaRecorder = null;
  });
}

function stopRecordingSafe() {
  return Promise.resolve(recordingStart)
    .catch(() => {})
    .then(() => stopRecording())
    .catch(() => new Blob([], { type: recorderMime || "audio/webm" }));
}

const SARVAM_TIMEOUT_MS = 4000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function transcribeWithSarvam(blob) {
  if (!blob?.size || navigator.onLine === false) return "";
  const fd = new FormData();
  const ext = blob.type && blob.type.includes("mp4") ? "mp4" : "webm";
  fd.append("file", blob, `answer.${ext}`);
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke("stt", { body: fd }),
      SARVAM_TIMEOUT_MS,
    );
    if (error) return "";
    return String(data?.transcript ?? "").trim();
  } catch {
    return "";
  }
}

/** @returns {Promise<{transcript: string, engine: 'sarvam' | 'web_speech' | 'typed'}>} */
export async function resolveTranscript(blob, webSpeechText) {
  const spoken = String(webSpeechText || "").trim();

  const sarvamText = await transcribeWithSarvam(blob);
  track("stt_result", { engine: "sarvam", empty: !sarvamText, chars: sarvamText.length });
  if (sarvamText) {
    store.practice.emptySttCount = 0;
    return { transcript: sarvamText, engine: "sarvam" };
  }

  track("stt_result", { engine: "web_speech", empty: !spoken, chars: spoken.length });
  if (spoken) {
    store.practice.emptySttCount = 0;
    return { transcript: spoken, engine: "web_speech" };
  }

  store.practice.emptySttCount = (store.practice.emptySttCount || 0) + 1;
  if (store.practice.emptySttCount >= 2) {
    track("typed_fallback_used");
    return { transcript: "", engine: "typed" };
  }
  return { transcript: "", engine: "web_speech" };
}

export async function uploadAnswerAudio(blob, userId, sessionId, questionId) {
  const path = `${userId}/${sessionId}/${questionId}.webm`;
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
    this.recognition = null;
    this.synth = null;
    this.supported = false;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      this.recognition = new SR();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-IN";
      this.supported = true;
    }
    if ("speechSynthesis" in window) this.synth = window.speechSynthesis;
  }
  isSpeechRecognitionSupported() { return this.supported; }
  startListening(onResult, onError, onEnd, onStart) {
    if (!this.recognition) { onError("unsupported"); return; }
    this.recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      if (final) onResult({ transcript: final, isFinal: true });
      else if (interim) onResult({ transcript: interim, isFinal: false });
    };
    this.recognition.onerror = (event) => onError(event.error || "error");
    this.recognition.onend = () => onEnd();
    this.recognition.onstart = () => { if (onStart) onStart(); };
    try { this.recognition.start(); } catch { /* already started */ }
  }
  stopListening() {
    if (this.recognition) { try { this.recognition.stop(); } catch { /* ignore */ } }
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

export function startListening() {
  if (!speechController.isSpeechRecognitionSupported()) {
    track("mic_permission", { result: "no_hw" });
    track("typed_fallback_used");
    store.practice.typingMode = true;
    renderPractice();
    return;
  }
  store.practice.transcript = "";
  store.practice.liveText = "";
  store.practice.transcriptRef = "";
  store.practice.micState = "listening";
  store.practice.listeningFlag = true;
  store.practice.feedback = null;
  store.practice.audioBlob = null;
  startTimer();
  renderPractice();
  recordingStart = startRecording().catch(() => {});
  speechController.startListening(
    (result) => {
      if (result.isFinal) {
        store.practice.transcriptRef += result.transcript;
        store.practice.transcript = store.practice.transcriptRef;
        store.practice.liveText = "";
      } else store.practice.liveText = result.transcript;
      patchLiveTranscript();
    },
    (err) => {
      if (err === "aborted") return;
      if (err === "not-allowed" || err === "service-not-allowed") {
        track("mic_permission", { result: "blocked" });
        track("typed_fallback_used");
        store.practice.typingMode = true;
      }
      store.practice.micState = "idle";
      store.practice.listeningFlag = false;
      stopTimer();
      renderPractice();
      stopRecordingSafe();
    },
    () => {
      if (store.practice.listeningFlag) stopListening();
    },
    () => {
      track("mic_permission", { result: "granted" });
      track("recording_started");
    },
  );
}

export async function stopListening() {
  store.practice.listeningFlag = false;
  speechController.stopListening();
  stopTimer();
  track("recording_ended", { duration_sec: store.practice.elapsedSec });
  store.practice.micState = "processing";
  renderPractice();
  const webSpeechText = store.practice.transcriptRef || store.practice.liveText;
  const blob = await stopRecordingSafe();
  store.practice.audioBlob = blob;
  const result = await resolveTranscript(blob, webSpeechText);
  if (result.engine === "typed") {
    store.practice.typingMode = true;
    store.practice.micState = "idle";
    renderPractice();
    return result;
  }
  submitAnswer(result);
  return result;
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
