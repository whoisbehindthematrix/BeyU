interface RingProps {
  progress: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  stroke = 8,
  label,
  sublabel,
}: RingProps) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-ink-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="text-brand-500 transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="text-base font-bold text-ink-900">{label}</span>
        )}
        {sublabel && (
          <span className="text-[10px] font-medium text-ink-400">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
