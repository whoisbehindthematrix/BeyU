interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export class SpeechController {
  private recognition: any = null;
  private synth: SpeechSynthesis | null = null;
  private supported: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const SR =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SR) {
        this.recognition = new SR();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-IN";
        this.supported = true;
      }
      if ("speechSynthesis" in window) {
        this.synth = window.speechSynthesis;
      }
    }
  }

  isSpeechRecognitionSupported(): boolean {
    return this.supported;
  }

  isSpeechSynthesisSupported(): boolean {
    return this.synth !== null;
  }

  startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (err: string) => void,
    onEnd: () => void,
  ): void {
    if (!this.recognition) {
      onError("unsupported");
      return;
    }
    this.recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) onResult({ transcript: final, isFinal: true });
      else if (interim) onResult({ transcript: interim, isFinal: false });
    };
    this.recognition.onerror = (event: any) => {
      onError(event.error || "error");
    };
    this.recognition.onend = () => {
      onEnd();
    };
    try {
      this.recognition.start();
    } catch {
      // already started
    }
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
  }

  speak(text: string, onEnd?: () => void): void {
    if (!this.synth) return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    const voices = this.synth.getVoices();
    const enInVoice = voices.find(
      (v) => v.lang === "en-IN" || v.lang.startsWith("en"),
    );
    if (enInVoice) utterance.voice = enInVoice;
    if (onEnd) utterance.onend = onEnd;
    this.synth.speak(utterance);
  }

  stopSpeaking(): void {
    if (this.synth) this.synth.cancel();
  }
}

export const speechController = new SpeechController();
