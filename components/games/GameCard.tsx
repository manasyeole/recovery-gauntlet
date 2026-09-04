import Link from "next/link";
import type { Game } from "@/lib/games/catalog";

/**
 * One deck on the shelf. Straight to the deck's own page rather than to the
 * create screen — a card game you cannot look at before playing is asking
 * people to pick a deck by its colour.
 */
export default function GameCard({ game, cards }: { game: Game; cards: number }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="card group relative flex flex-col overflow-hidden rounded-chunk p-5 transition
        hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 active:scale-[0.99]
        sm:p-6"
      style={{ borderColor: game.accent + "55" }}
    >
      {/* A wash of the deck's own colour, kept behind the text at low weight. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-60
          transition group-hover:scale-110"
        style={{ background: game.tint }}
      />

      <span
        aria-hidden
        className="relative grid h-14 w-14 place-items-center rounded-2xl text-3xl"
        style={{ background: game.tint }}
      >
        {game.emoji}
      </span>

      <h2 className="relative mt-4 font-display text-xl font-bold" style={{ color: game.ink }}>
        {game.name}
      </h2>
      <p className="relative mt-1 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        {game.tagline}
      </p>

      {/* The six stat names are the fastest way to say what this deck *is*. */}
      <p className="relative mt-3 text-[0.68rem] font-semibold leading-relaxed"
        style={{ color: "var(--ink-soft)" }}>
        {game.statsShort.join(" · ")}
      </p>

      <p className="relative mt-3 text-xs font-semibold tabular-nums" style={{ color: game.accent }}>
        {cards} cards
      </p>
    </Link>
  );
}
