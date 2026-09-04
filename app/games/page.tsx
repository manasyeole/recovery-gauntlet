import type { Metadata } from "next";
import Link from "next/link";
import GameCard from "@/components/games/GameCard";
import JoinCodeForm from "@/components/games/JoinCodeForm";
import { cardCount } from "@/lib/games/cards";
import { GAMES } from "@/lib/games/catalog";

export const metadata: Metadata = {
  title: "The Games Room — seven decks, one duel",
  description: "A combat card game across seven decks. Play the computer or share a code.",
  robots: { index: false, follow: false },
};

/**
 * The shelf. Three things to do here and nothing else: look at a deck, join a
 * duel you were handed the code for, or pick a fight with the computer.
 */
export default function GamesPage() {
  return (
    <main className="screen px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <header className="text-center">
          <span aria-hidden className="block text-4xl">
            🃏
          </span>
          <h1 className="mt-4 text-balance font-display text-[2rem] font-bold leading-tight sm:text-4xl">
            The Games Room
          </h1>
          <p className="muted mx-auto mt-3 max-w-md text-balance text-sm leading-relaxed">
            Pick a deck. Put a card down face-down and choose one of its six stats to attack with —
            their card defends with the same one. Both turn over at once.
          </p>
        </header>

        {/* ----------------------------- join ----------------------------- */}
        <section className="card mt-9 rounded-chunk p-5 sm:p-6" aria-labelledby="join-heading">
          <h2 id="join-heading" className="mb-3 text-sm font-semibold">
            Got a code?
          </h2>
          <JoinCodeForm />
        </section>

        {/* ---------------------------- the shelf -------------------------- */}
        <section className="mt-10" aria-labelledby="shelf-heading">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="shelf-heading" className="text-sm font-semibold">
              The decks
            </h2>
            <Link
              href="/games/create?mode=solo"
              className="text-xs font-semibold underline underline-offset-4"
              style={{ color: "var(--clay-600)" }}
            >
              Play the computer →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {GAMES.map((game) => (
              <GameCard key={game.slug} game={game} cards={cardCount(game.slug)} />
            ))}
          </div>
        </section>

        <p className="muted mt-12 text-center text-xs">
          <Link href="/" className="underline underline-offset-4 hover:text-ink">
            Back to the gauntlet
          </Link>
        </p>
      </div>
    </main>
  );
}
