import { useState } from "react";
import { Volume2, Check, X, ArrowRight, Layers } from "lucide-react";
import { Button } from "./Button";
import { FLASHCARDS } from "../config";
import { speechController } from "../lib/speech";

interface FlashcardDeckProps {
  onComplete: (learned: number) => void;
  onExit: () => void;
}

export function FlashcardDeck({ onComplete, onExit }: FlashcardDeckProps) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState(0);
  const [done, setDone] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);

  const card = FLASHCARDS[idx];

  const handleSayIt = () => {
    speechController.speak(card.word);
  };

  const handleSwipe = (dir: "left" | "right") => {
    setExitDir(dir);
    if (dir === "right") {
      setLearned((l) => l + 1);
    }
    setTimeout(() => {
      setExitDir(null);
      setDragX(0);
      if (idx < FLASHCARDS.length - 1) {
        setIdx(idx + 1);
        setFlipped(false);
      } else {
        setDone(true);
      }
    }, 250);
  };

  if (done) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-500/10 text-success-500 animate-scale-in">
          <Layers size={36} />
        </div>
        <h2 className="mt-6 text-xl font-extrabold text-ink-900">
          Deck complete!
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          You learned {learned} of {FLASHCARDS.length} words
        </p>
        <Button full className="mt-8 max-w-[260px]" onClick={() => onComplete(learned)}>
          Claim +{learned * 2} points <ArrowRight size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-surface-1">
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
        <div className="flex items-center gap-1.5">
          {FLASHCARDS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === idx
                  ? "w-6 bg-brand-500"
                  : i < idx
                    ? "w-4 bg-brand-300"
                    : "w-1.5 bg-ink-200"
              }`}
            />
          ))}
        </div>
        <div className="w-9" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Card */}
        <div
          className="relative w-full max-w-[300px]"
          style={{
            transform: exitDir
              ? `translateX(${exitDir === "right" ? 200 : -200}px) rotate(${exitDir === "right" ? 20 : -20}deg)`
              : `translateX(${dragX}px) rotate(${dragX * 0.1}deg)`,
            opacity: exitDir ? 0 : 1,
            transition: exitDir ? "all 0.25s ease-out" : dragX ? "none" : "all 0.3s ease-out",
          }}
        >
          <button
            onClick={() => setFlipped((f) => !f)}
            className="relative flex h-72 w-full flex-col items-center justify-center rounded-3xl bg-surface-0 p-6 text-center shadow-card"
          >
            {!flipped ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Word {idx + 1} of {FLASHCARDS.length}
                </p>
                <h2 className="mt-3 text-3xl font-extrabold text-ink-900">
                  {card.word}
                </h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSayIt();
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-500"
                >
                  <Volume2 size={16} />
                  Say it
                </button>
                <p className="mt-4 text-xs text-ink-400">Tap to flip</p>
              </>
            ) : (
              <div className="animate-fade-in">
                <p className="text-sm font-bold text-ink-900">{card.meaning}</p>
                <p className="mt-3 rounded-xl bg-surface-2 px-4 py-3 text-sm italic text-ink-600">
                  "{card.example}"
                </p>
                <p className="mt-4 text-xs text-ink-400">Tap to flip back</p>
              </div>
            )}
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => handleSwipe("left")}
            className="tap-target flex h-12 w-12 items-center justify-center rounded-full bg-surface-0 text-ink-400 shadow-soft transition-transform active:scale-90"
          >
            <X size={22} />
          </button>
          <button
            onClick={() => handleSwipe("right")}
            className="tap-target flex h-14 w-14 items-center justify-center rounded-full bg-success-500 text-white shadow-popSuccess transition-transform active:scale-90"
          >
            <Check size={26} />
          </button>
        </div>
        <p className="mt-4 text-xs font-medium text-ink-400">
          {learned} learned · swipe or tap ✓
        </p>
      </div>
    </div>
  );
}
