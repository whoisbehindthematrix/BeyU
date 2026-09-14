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
let recStream = null;
let recAudioCtx = null;
let recAnalyser = null;
let recTimeData = null;
let recProcessor = null;
let pcmChunks = [];
let pcmSampleRate = 16000;

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function pickRecorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  if (isAndroid()) {
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
    if (MediaRecorder.isTypeSupported("audio/aac")) return "audio/aac";
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
    if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
    return "";
  }
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

function rmsOf(samples) {
  if (!samples?.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

function attachCapture(stream) {
  recAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  pcmSampleRate = recAudioCtx.sampleRate || 44100;
  pcmChunks = [];
  const src = recAudioCtx.createMediaStreamSource(stream);
  recAnalyser = recAudioCtx.createAnalyser();
  recAnalyser.fftSize = 2048;
  recTimeData = new Uint8Array(recAnalyser.fftSize);
  src.connect(recAnalyser);

  const makeProcessor = recAudioCtx.createScriptProcessor || recAudioCtx.createJavaScriptNode;
  if (makeProcessor) {
    recProcessor = makeProcessor.call(recAudioCtx, 4096, 1, 1);
    recProcessor.onaudioprocess = (e) => {
      pcmChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };
    src.connect(recProcessor);
    const mute = recAudioCtx.createGain();
    mute.gain.value = 0;
    recProcessor.connect(mute);
    mute.connect(recAudioCtx.destination);
  }
  recAudioCtx.resume?.();
}

function recordingIsLoud() {
  const last = pcmChunks[pcmChunks.length - 1];
  if (last?.length && rmsOf(last) > 0.012) return true;
  if (!recAnalyser || !recTimeData) return false;
  recAnalyser.getByteTimeDomainData(recTimeData);
  let sum = 0;
  for (let i = 0; i < recTimeData.length; i++) {
    const v = (recTimeData[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / recTimeData.length) > 0.02;
}

function downsample(input, fromRate, toRate) {
  if (!input?.length) return input;
  if (fromRate === toRate) return input;
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
  recAnalyser = null;
  recTimeData = null;
}

function releaseTracks(rec) {
  rec?.stream?.getTracks().forEach((t) => t.stop());
  recStream?.getTracks().forEach((t) => t.stop());
  recStream = null;
  releaseCapture();
}

export async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) return;
  const android = isAndroid();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: android
      ? { echoCancellation: false, noiseSuppression: false, autoGainControl: true, channelCount: 1 }
      : { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  recStream = stream;
  chunks = [];
  pcmChunks = [];
  track("mic_permission", { result: "granted" });
  track("recording_started");
  try {
    attachCapture(stream);
  } catch (err) {
    console.error(err);
  }
  if (typeof MediaRecorder === "undefined") return;
  try {
    recorderMime = pickRecorderMime();
    mediaRecorder = recorderMime
      ? new MediaRecorder(stream, { mimeType: recorderMime })
      : new MediaRecorder(stream);
    recorderMime = mediaRecorder.mimeType || recorderMime || "audio/webm";
    mediaRecorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    mediaRecorder.start(250);
  } catch (err) {
    console.error(err);
    mediaRecorder = null;
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
      const wav = wavFromPcm();
      const fallback = new Blob(chunks, { type: mime.split(";")[0] || mime });
      releaseTracks(rec);
      mediaRecorder = null;
      resolve(wav && wav.size > 1000 ? wav : fallback);
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
  const ext = type.includes("wav")
    ? "wav"
    : type.includes("mp4") || type.includes("m4a") || type.includes("aac")
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
      const loud = recordingIsLoud();
      if (loud) {
        store.practice.lastSpeechAt = Date.now();
        store.practice.hearingVoice = true;
        patchLiveTranscript();
      }
      const quietMs = Date.now() - (store.practice.lastSpeechAt || Date.now());
      if (quietMs >= 8000) {
        const spoke = (store.practice.transcriptRef || store.practice.liveText || "").trim();
        store.practice.silenceTimeout = !spoke && !loud && !store.practice.hearingVoice;
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
  if (isAndroid() || !speechController.isSpeechRecognitionSupported()) {
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
  const heardAudio = store.practice.hearingVoice || (blob && blob.size > 2000);
  if (store.practice.silenceTimeout && !webSpeechText && !heardAudio) {
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
