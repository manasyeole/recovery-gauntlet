"use client";

/**
 * A draining bar and a number. The bar is the one people actually watch, so
 * it gets the colour; the number is there for anyone who wants to argue about
 * whether they were in time.
 */
export default function RoundTimer({
  msLeft,
  totalMs,
  accent,
}: {
  msLeft: number;
  totalMs: number;
  accent: string;
}) {
  const pct = Math.max(0, Math.min(100, (msLeft / Math.max(1, totalMs)) * 100));
  const seconds = Math.ceil(msLeft / 1000);
  // The last few seconds go clay regardless of the game's own colour — it is
  // the one moment the palette should stop being polite.
  const urgent = msLeft <= 5000;

  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={Math.round(totalMs / 1000)}
        aria-valuenow={seconds}
        aria-label="Seconds left"
      >
        <div
          className="h-full rounded-full transition-[width] duration-100 ease-linear"
          style={{ width: `${pct}%`, background: urgent ? "var(--clay-500)" : accent }}
        />
      </div>
      <span
        className={`w-8 text-right text-sm font-bold tabular-nums ${urgent ? "text-clay-600" : ""}`}
        style={urgent ? undefined : { color: "var(--ink-soft)" }}
      >
        {seconds}
      </span>
    </div>
  );
}
