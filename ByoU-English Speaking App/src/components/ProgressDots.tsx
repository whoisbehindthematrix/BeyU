interface ProgressDotsProps {
  total: number;
  current: number;
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current
              ? "w-6 bg-brand-500"
              : i === current
                ? "w-6 bg-brand-300"
                : "w-1.5 bg-ink-200"
          }`}
        />
      ))}
    </div>
  );
}
