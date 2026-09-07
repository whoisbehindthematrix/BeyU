import { useEffect, useState } from "react";

interface ConfettiProps {
  trigger: boolean;
}

const COLORS = ["#0A61E4", "#16A87A", "#F5A623", "#F4553E", "#5B98FF"];

export function Confetti({ trigger }: ConfettiProps) {
  const [pieces, setPieces] = useState<
    { id: number; x: number; color: string; delay: number; rotate: number }[]
  >([]);

  useEffect(() => {
    if (!trigger) return;
    const newPieces = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.3,
      rotate: Math.random() * 360,
    }));
    setPieces(newPieces);
    const t = setTimeout(() => setPieces([]), 1300);
    return () => clearTimeout(t);
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 h-2 w-2 rounded-sm"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confettiFall 1s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
