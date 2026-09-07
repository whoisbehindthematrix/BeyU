import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, SkipForward, Lightbulb, ArrowRight, Check, Volume2, RotateCcw, TrendingUp, Repeat, Keyboard, Send } from "lucide-react";
import { Button } from "./Button";
import { ProgressDots } from "./ProgressDots";
import { Confetti } from "./Confetti";
import { PROMPTS, FEEDBACK_TEMPLATES, MOOD_OPTIONS } from "../config";
import type { MicState } from "../lib/feedback";
import type { FeedbackChunk } from "../lib/feedback";
import { generateFeedback } from "../lib/feedback";
import { speechController } from "../lib/speech";

interface PracticeProps {
  onComplete: (points: number, mood: string) => void;
  onExit: () => void;
  startIndex?: number;
  courseQuestions?: string[] | null;
}

export function Practice({ onComplete, onExit, startIndex = 0, courseQuestions }: PracticeProps) {
  const [promptIdx, setPromptIdx] = useState(startIndex);
  const [micState, setMicState] = useState<MicState>("idle");
  const [transcript, setTranscript] = useState("");
  const [liveText, setLiveText] = useState("");
  const [feedback, setFeedback] = useState<FeedbackChunk[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [typingMode, setTypingMode] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const transcriptRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasCourseQs = courseQuestions && courseQuestions.length > 0;
  const questions = hasCourseQs
    ? courseQuestions.map((q, i) => ({
        id: `cq-${i}`,
        text: q,
        difficulty: "easy" as const,
        hint: "Take your time. Start with 'I would say...' and build from there.",
        idealKeywords: [],
      }))
    : PROMPTS;
  const prompt = questions[promptIdx % questions.length];
  const totalPrompts = hasCourseQs ? questions.length : 3;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [liveText, transcript]);

  // Timer for recording
  const startTimer = useCallback(() => {
    setElapsedSec(0);
    timerRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleMicTap = () => {
    if (micState === "idle") {
      startListening();
    } else if (micState === "listening") {
      stopListening();
    }
  };

  const startListening = () => {
    if (!speechController.isSpeechRecognitionSupported()) {
      setTypingMode(true);
      return;
    }
    setTranscript("");
    setLiveText("");
    transcriptRef.current = "";
    setMicState("listening");
    setFeedback(null);
    startTimer();
    speechController.startListening(
      (result) => {
        if (result.isFinal) {
          transcriptRef.current += result.transcript;
          setTranscript(transcriptRef.current);
          setLiveText("");
        } else {
          setLiveText(result.transcript);
        }
      },
      (err) => {
        if (err === "not-allowed" || err === "service-not-allowed") {
          setTypingMode(true);
        }
        setMicState("idle");
        stopTimer();
      },
      () => {
        if (micState === "listening") {
          stopListening();
        }
      },
    );
  };

  const stopListening = () => {
    speechController.stopListening();
    stopTimer();
    const finalText = transcriptRef.current || liveText;
    submitAnswer(finalText);
  };

  const submitAnswer = (text: string) => {
    setMicState("processing");
    setTimeout(() => {
      setTranscript(text);
      const fb = generateFeedback(text, prompt.idealKeywords, FEEDBACK_TEMPLATES);
      setFeedback(fb);
      setMicState("idle");
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1300);
    }, 1200);
  };

  const handleTypedSubmit = () => {
    const text = typedText.trim();
    if (!text) return;
    setTranscript(text);
    setTypedText("");
    submitAnswer(text);
  };

  const handleSkip = () => {
    resetForNext();
    if (promptIdx < totalPrompts - 1) {
      setPromptIdx(promptIdx + 1);
    } else {
      onComplete(completedCount * 15, "");
      onExit();
    }
  };

  const resetForNext = () => {
    setFeedback(null);
    setTranscript("");
    setLiveText("");
    transcriptRef.current = "";
    setShowHint(false);
    setTypedText("");
    setElapsedSec(0);
    stopTimer();
  };

  const handleNextPrompt = () => {
    setCompletedCount((c) => c + 1);
    if (promptIdx < totalPrompts - 1) {
      setPromptIdx(promptIdx + 1);
      resetForNext();
    } else {
      setShowMood(true);
    }
  };

  const handleMoodSelect = (mood: string) => {
    const points = (completedCount + 1) * 20;
    onComplete(points, mood);
    onExit();
  };

  const isRecording = micState === "listening";
  const hasAnyText = transcript || liveText;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-surface-1">
      <Confetti trigger={confetti} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          onClick={onExit}
          className="tap-target rounded-lg p-2 text-ink-400 hover:bg-surface-2"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <ProgressDots total={totalPrompts} current={promptIdx} />
        <button
          onClick={handleSkip}
          className="tap-target rounded-lg p-2 text-ink-400 hover:bg-surface-2"
        >
          <SkipForward size={20} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-5 pb-4">
        {/* Coach bubble */}
        <div className="flex gap-2.5 animate-fade-in">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
            B
          </div>
          <div className="flex-1 rounded-2xl rounded-tl-md bg-surface-0 px-4 py-3 shadow-soft">
            <p className="text-sm font-medium leading-relaxed text-ink-800">
              {prompt.text}
            </p>
            <button
              onClick={() => speechController.speak(prompt.text)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-500"
            >
              <Volume2 size={13} />
              Replay
            </button>
          </div>
        </div>

        {/* Hint */}
        {showHint && (
          <div className="mt-3 ml-11 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 animate-slide-up">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed text-ink-600">{prompt.hint}</p>
          </div>
        )}

        {/* Live answer panel — always visible between bubble and mic when no feedback */}
        {!feedback && (
          <div className="mt-4 ml-11 rounded-2xl bg-surface-0 px-4 py-4 shadow-soft min-h-[100px] animate-fade-in">
            {isRecording && (
              <div className="mb-3 flex items-center justify-between">
                {/* Waveform indicator */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 h-5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-accent-500 animate-wave"
                        style={{ animationDelay: `${i * 100}ms`, height: "100%" }}
                      />
                    ))}
                  </div>
                  <span className="ml-1.5 text-xs font-semibold text-accent-500">Recording</span>
                </div>
                {/* Elapsed timer */}
                <span className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-mono font-semibold text-ink-600">
                  {formatTime(elapsedSec)}
                </span>
              </div>
            )}

            {hasAnyText || isRecording ? (
              <p className="text-sm leading-relaxed text-ink-700">
                {transcript}
                {transcript && liveText ? " " : ""}
                <span className="text-ink-400">{liveText}</span>
                {isRecording && !transcript && !liveText && (
                  <span className="text-ink-400">Listening...</span>
                )}
                {isRecording && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-brand-500 align-middle" />
                )}
              </p>
            ) : micState === "processing" ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: "120ms" }} />
                  <span className="h-2 w-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: "240ms" }} />
                </div>
                <span className="text-xs text-ink-400">Coach is thinking...</span>
              </div>
            ) : (
              <p className="text-sm text-ink-400 italic">
                Your words will appear here as you speak.
              </p>
            )}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className="mt-5 space-y-3 animate-slide-up">
            {/* Chunk 1: What worked */}
            <div className="rounded-2xl bg-success-500/8 p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-500/15 text-success-600">
                  <Check size={16} />
                </div>
                <p className="text-sm font-bold text-ink-900">What worked</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                {feedback[0].body}
              </p>
            </div>

            {/* Chunk 2: One upgrade */}
            <div className="rounded-2xl bg-amber-500/8 p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                  <TrendingUp size={16} />
                </div>
                <p className="text-sm font-bold text-ink-900">One upgrade</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                {feedback[1].body}
              </p>
            </div>

            {/* Chunk 3: Say it once more */}
            <div className="rounded-2xl bg-surface-0 p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                  <Repeat size={16} />
                </div>
                <p className="text-sm font-bold text-ink-900">Say it once more</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {feedback[2].body}
              </p>
              <button
                onClick={() => {
                  const better = feedback[1].better || prompt.text;
                  speechController.speak(better);
                  if (!typingMode) startListening();
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-accent-500/10 px-3 py-2 text-sm font-medium text-accent-500 transition-transform active:scale-95"
              >
                <RotateCcw size={15} />
                Re-record (10s)
              </button>
            </div>

            {transcript && (
              <div className="rounded-2xl bg-surface-0 p-4 shadow-soft">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  You said
                </p>
                <p className="text-sm italic leading-relaxed text-ink-600">
                  &ldquo;{transcript}&rdquo;
                </p>
              </div>
            )}

            <Button full className="mt-2" onClick={handleNextPrompt}>
              {promptIdx < totalPrompts - 1 ? "Next question" : "See your results"}{" "}
              <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom input area — mic or text, raised with pb-[120px] safe zone */}
      {!feedback && !showMood && (
        <div className="border-t border-ink-100 bg-surface-0 px-5 pt-4 pb-[env(safe-area-inset-bottom,32px)]" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 32px), 32px)" }}>
          {!showHint && !hasAnyText && micState === "idle" && !typingMode && (
            <button
              onClick={() => setShowHint(true)}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500"
            >
              <Lightbulb size={14} />
              Need a hint?
            </button>
          )}

          {typingMode ? (
            /* Text input mode */
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTypedSubmit(); }}
                  placeholder="Type your answer here..."
                  className="flex-1 rounded-xl border border-ink-200 bg-surface-1 px-4 py-3 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                />
                <button
                  onClick={handleTypedSubmit}
                  disabled={!typedText.trim()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white shadow-popAccent transition-all active:scale-95 disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none"
                >
                  <Send size={20} />
                </button>
              </div>
              <button
                onClick={() => setTypingMode(false)}
                className="mx-auto flex items-center gap-1.5 text-xs font-medium text-ink-400"
              >
                <Mic size={13} />
                Switch to mic
              </button>
            </div>
          ) : (
            /* Mic mode */
            <div>
              {/* Mic button — centered with generous bottom spacing */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  {micState === "listening" && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-accent-500/30 animate-pulse-ring" />
                      <div className="absolute inset-0 rounded-full bg-accent-500/20 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
                    </>
                  )}
                  <button
                    onClick={handleMicTap}
                    disabled={micState === "processing"}
                    className={`relative flex h-24 w-24 items-center justify-center rounded-full shadow-popAccent transition-all active:scale-95 ${
                      micState === "listening"
                        ? "bg-accent-500 text-white"
                        : micState === "processing"
                          ? "bg-ink-200 text-ink-400"
                          : "bg-accent-500 text-white"
                    }`}
                  >
                    {micState === "processing" ? (
                      <div className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2.5 w-2.5 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay: "120ms" }} />
                        <span className="h-2.5 w-2.5 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay: "240ms" }} />
                      </div>
                    ) : micState === "listening" ? (
                      <div className="flex items-center gap-1 h-8">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <span
                            key={i}
                            className="w-1 rounded-full bg-white animate-wave"
                            style={{ animationDelay: `${i * 120}ms`, height: "100%" }}
                          />
                        ))}
                      </div>
                    ) : (
                      <Mic size={32} />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-center text-sm font-semibold text-ink-600">
                {micState === "idle" && "Tap and answer out loud"}
                {micState === "listening" && "I'm listening... tap to stop"}
                {micState === "processing" && "Coach is thinking..."}
              </p>
              {/* Type instead — always visible */}
              <button
                onClick={() => {
                  if (micState === "listening") {
                    speechController.stopListening();
                    stopTimer();
                    setMicState("idle");
                  }
                  setTypingMode(true);
                }}
                className="mt-3 mx-auto flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-600"
              >
                <Keyboard size={13} />
                Type instead
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mood check */}
      {showMood && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-surface-0 px-6 animate-fade-in">
          <Confetti trigger={true} />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-500/10 text-success-500 animate-scale-in">
            <Check size={40} />
          </div>
          <h2 className="mt-6 text-xl font-extrabold text-ink-900">
            You practised out loud today
          </h2>
          <p className="mt-2 text-sm font-semibold text-success-500">
            +{(completedCount + 1) * 20} points
          </p>
          <p className="mt-1 text-sm text-ink-500">
            How did that feel?
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-[260px]">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => handleMoodSelect(mood.id)}
                className="flex flex-col items-center gap-1 rounded-2xl bg-surface-1 py-4 shadow-soft transition-all active:scale-95 hover:bg-surface-2"
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-sm font-medium text-ink-700">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
