import type { Metadata } from "next";
import Link from "next/link";
import GameCard from "@/components/games/GameCard";
import JoinCodeForm from "@/components/games/JoinCodeForm";
import { GAMES } from "@/lib/games/catalog";
import { questionCount } from "@/lib/games/questions";

export const metadata: Metadata = {
  title: "The Games Room — pick one, share a code",
  description: "Seven quizzes, one room code, no accounts.",
  robots: { index: false, follow: false },
};

/**
 * The shelf. Two things to do here and nothing else: start a room, or join
 * one you were handed the code for.
 */
export default function GamesPage() {
  return (
    <main className="screen px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <header className="text-center">
          <span aria-hidden className="block text-4xl">
            🎮
          </span>
          <h1 className="mt-4 text-balance font-display text-[2rem] font-bold leading-tight sm:text-4xl">
            The Games Room
          </h1>
          <p className="muted mx-auto mt-3 max-w-md text-balance text-sm leading-relaxed">
            Pick a game, get a code, read it out. Everyone answers the same question at the same
            time and the clock is worth as much as being right.
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
          <h2 id="shelf-heading" className="mb-4 text-sm font-semibold">
            Or start one
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {GAMES.map((game) => (
              <GameCard key={game.slug} game={game} questions={questionCount(game.slug)} />
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
