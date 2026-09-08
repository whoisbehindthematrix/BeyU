import { store, startTimer, stopTimer, submitAnswer, hooks } from "./session.js";

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
  startListening(onResult, onError, onEnd) {
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

export function startListening() {
  const practice = store.practice;
  if (!speechController.isSpeechRecognitionSupported()) { practice.typingMode = true; hooks.renderPractice(); return; }
  practice.transcript = "";
  practice.liveText = "";
  practice.transcriptRef = "";
  practice.micState = "listening";
  practice.listeningFlag = true;
  practice.feedback = null;
  startTimer();
  hooks.renderPractice();
  speechController.startListening(
    (result) => {
      if (result.isFinal) {
        practice.transcriptRef += result.transcript;
        practice.transcript = practice.transcriptRef;
        practice.liveText = "";
      } else practice.liveText = result.transcript;
      hooks.renderPractice();
    },
    (err) => {
      if (err === "not-allowed" || err === "service-not-allowed") practice.typingMode = true;
      practice.micState = "idle";
      practice.listeningFlag = false;
      stopTimer();
      hooks.renderPractice();
    },
    () => {
      if (practice.listeningFlag) stopListening();
    },
  );
}

export function stopListening() {
  const practice = store.practice;
  practice.listeningFlag = false;
  speechController.stopListening();
  stopTimer();
  submitAnswer(practice.transcriptRef || practice.liveText);
}

export function handleTypedSubmit() {
  const practice = store.practice;
  const text = practice.typedText.trim();
  if (!text) return;
  practice.transcript = text;
  practice.typedText = "";
  submitAnswer(text);
}
