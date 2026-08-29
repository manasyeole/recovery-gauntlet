import Link from "next/link";
import type { Game } from "@/lib/games/catalog";

/**
 * One tile on the shelf. Straight to the create screen with the game already
 * chosen — picking a game and starting a room is one decision, not two.
 */
export default function GameCard({ game, questions }: { game: Game; questions: number }) {
  return (
    <Link
      href={`/games/create?game=${game.slug}`}
      className="card group relative flex flex-col overflow-hidden rounded-chunk p-5 transition
        hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 active:scale-[0.99]
        sm:p-6"
      style={{ borderColor: game.accent + "55" }}
    >
      {/* A wash of the game's own colour, kept behind the text at low weight. */}
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

      <p className="relative mt-4 text-xs font-semibold tabular-nums" style={{ color: game.accent }}>
        {questions} questions
      </p>
    </Link>
  );
}
