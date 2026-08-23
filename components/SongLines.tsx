import type { SongLine } from "@/lib/steps";

/**
 * The decorative couplet drawn behind a screen — two lines of big rounded
 * type, bleeding off the left edge, over a soft wash of the step's tint.
 *
 * Deliberately uses the app's own display stack rather than a webfont, so
 * builds still need no network access (see the note in app/layout.tsx).
 *
 * Purely decorative: aria-hidden, non-selectable, never hit-testable.
 */
export default function SongLines({
  lines,
  tint = "bg-clay-50",
}: {
  lines: SongLine;
  /** Tailwind class for the top wash, e.g. "bg-tint-sage". */
  tint?: string;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      <div
        className={`absolute inset-x-0 top-0 h-1/2 opacity-60 ${tint}`}
        style={{
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />

      <div className="absolute inset-x-0 bottom-8 origin-bottom-left -rotate-3">
        <p className="-ml-6 whitespace-nowrap font-display text-[46px] font-bold leading-[1.04] tracking-[-0.03em] text-clay-300 opacity-40">
          {lines[0]}
        </p>
        <p className="ml-1.5 whitespace-nowrap font-display text-[32px] font-bold leading-[1.04] tracking-[-0.03em] text-clay-300 opacity-25">
          {lines[1]}
        </p>
      </div>
    </div>
  );
}
