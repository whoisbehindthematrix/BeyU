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
let recorderMime = "audio/webm";
let recordingStart = Promise.resolve();
let recAudioCtx = null;
let recAnalyser = null;
let recTimeData = null;

function pickRecorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  if (MediaRecorder.isTypeSupported("audio/aac")) return "audio/aac";
  return "";
}

function attachLevelMeter(stream) {
  try {
    recAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = recAudioCtx.createMediaStreamSource(stream);
    recAnalyser = recAudioCtx.createAnalyser();
    recAnalyser.fftSize = 512;
    src.connect(recAnalyser);
    recTimeData = new Uint8Array(recAnalyser.fftSize);
    recAudioCtx.resume?.();
  } catch {
    recAudioCtx = null;
    recAnalyser = null;
    recTimeData = null;
  }
}

function recordingIsLoud() {
  if (!recAnalyser || !recTimeData) return false;
  recAnalyser.getByteTimeDomainData(recTimeData);
  let sum = 0;
  for (let i = 0; i < recTimeData.length; i++) {
    const v = (recTimeData[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / recTimeData.length) > 0.035;
}

function releaseLevelMeter() {
  try { recAudioCtx?.close(); } catch { /* ignore */ }
  recAudioCtx = null;
  recAnalyser = null;
  recTimeData = null;
}

function releaseTracks(rec) {
  rec?.stream?.getTracks().forEach((t) => t.stop());
  releaseLevelMeter();
}

export async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  try {
    chunks = [];
    recorderMime = pickRecorderMime();
    mediaRecorder = recorderMime
      ? new MediaRecorder(stream, { mimeType: recorderMime })
      : new MediaRecorder(stream);
    recorderMime = mediaRecorder.mimeType || recorderMime || "audio/webm";
    mediaRecorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    attachLevelMeter(stream);
    mediaRecorder.start(250);
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
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const blob = new Blob(chunks, { type: mime.split(";")[0] || mime });
      releaseTracks(rec);
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

const SARVAM_TIMEOUT_MS = 15000;

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
  const type = blob.type || "";
  const ext = type.includes("mp4") || type.includes("m4a") || type.includes("aac")
    ? "m4a"
    : type.includes("mpeg") || type.includes("mp3")
      ? "mp3"
      : "webm";
  fd.append("file", blob, `answer.${ext}`);
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token || SUPABASE_ANON_KEY;
    const res = await withTimeout(
      fetch(`${SUPABASE_URL}/functions/v1/stt`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: fd,
      }),
      SARVAM_TIMEOUT_MS,
    );
    if (!res.ok) return "";
    const data = await res.json();
    return String(data?.transcript || data?.translated_text || "").trim();
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
  return { transcript: "", engine: "web_speech", silenceTimeout: !!store.practice.silenceTimeout };
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
    this.keepAlive = false;
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
    this.keepAlive = true;
    this.recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript + " ";
        else interim += transcript;
      }
      if (final) onResult({ transcript: final, isFinal: true });
      else if (interim) onResult({ transcript: interim, isFinal: false });
    };
    this.recognition.onerror = (event) => {
      const err = event.error || "error";
      if (err === "aborted" || err === "no-speech") return;
      if (this.keepAlive && (err === "network" || err === "audio-capture")) {
        try { this.recognition.start(); } catch { /* ignore */ }
        return;
      }
      onError(err);
    };
    this.recognition.onend = () => {
      if (!this.keepAlive) {
        onEnd();
        return;
      }
      setTimeout(() => {
        if (!this.keepAlive) return;
        try { this.recognition.start(); } catch { /* ignore */ }
      }, 80);
    };
    this.recognition.onstart = () => { if (onStart) onStart(); };
    try { this.recognition.start(); } catch { /* already started */ }
  }
  stopListening() {
    this.keepAlive = false;
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
  store.practice.lastSpeechAt = Date.now();
  store.practice.timer = setInterval(() => {
    store.practice.elapsedSec += 1;
    if (store.practice.micState === "listening" && store.practice.listeningFlag) {
      if (recordingIsLoud()) store.practice.lastSpeechAt = Date.now();
      const quietMs = Date.now() - (store.practice.lastSpeechAt || Date.now());
      if (quietMs >= 8000) {
        const spoke = (store.practice.transcriptRef || store.practice.liveText || "").trim();
        store.practice.silenceTimeout = !spoke && !recordingIsLoud();
        stopListening();
        return;
      }
    }
    patchRecordingTimer();
  }, 1000);
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function startListening() {
  store.practice.sttFailed = false;
  store.practice.transcript = "";
  store.practice.liveText = "";
  store.practice.transcriptRef = "";
  store.practice.micState = "listening";
  store.practice.listeningFlag = true;
  store.practice.feedback = null;
  store.practice.audioBlob = null;
  store.practice.silenceTimeout = false;
  startTimer();
  renderPractice();
  recordingStart = startRecording().catch((err) => {
    console.error(err);
    track("mic_permission", { result: "blocked" });
  });
  if (!speechController.isSpeechRecognitionSupported()) {
    return;
  }
  speechController.startListening(
    (result) => {
      if (result.isFinal) {
        store.practice.transcriptRef += result.transcript;
        store.practice.transcript = store.practice.transcriptRef;
        store.practice.liveText = "";
      } else store.practice.liveText = result.transcript;
      store.practice.lastSpeechAt = Date.now();
      patchLiveTranscript();
    },
    (err) => {
      if (err === "aborted") return;
      if (err === "not-allowed" || err === "service-not-allowed") {
        track("mic_permission", { result: "blocked" });
        store.practice.typingMode = true;
        store.practice.listeningFlag = false;
        store.practice.micState = "idle";
        stopTimer();
        renderPractice();
        stopRecordingSafe();
        return;
      }
    },
    () => {},
    () => {
      track("mic_permission", { result: "granted" });
      track("recording_started");
    },
  );
}

export async function stopListening() {
  if (store.practice.micState === "processing") return null;
  store.practice.listeningFlag = false;
  speechController.stopListening();
  stopTimer();
  track("recording_ended", { duration_sec: store.practice.elapsedSec, silence_timeout: !!store.practice.silenceTimeout });
  store.practice.micState = "processing";
  renderPractice();
  const webSpeechText = `${store.practice.transcriptRef || ""} ${store.practice.liveText || ""}`.trim();
  const blob = await stopRecordingSafe();
  store.practice.audioBlob = blob;
  if (store.practice.silenceTimeout && !webSpeechText && !(blob && blob.size > 800)) {
    const result = { transcript: "", engine: "web_speech", silenceTimeout: true };
    submitAnswer(result);
    return result;
  }
  const result = await resolveTranscript(blob, webSpeechText);
  if (!String(result.transcript || "").trim() && !result.silenceTimeout) {
    store.practice.sttFailed = true;
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
