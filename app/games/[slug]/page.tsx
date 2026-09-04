import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PlayingCard from "@/components/games/PlayingCard";
import { cardsByRarity, RARITIES, RARITY_BUDGET, rosterFor } from "@/lib/games/cards";
import { GAME_SLUGS, getGame } from "@/lib/games/catalog";

/** Seven decks, none of them changing between deploys. */
export function generateStaticParams() {
  return GAME_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const game = getGame((await params).slug);
  return {
    title: game ? `${game.name} — the deck` : "Deck",
    description: game?.tagline,
    robots: { index: false, follow: false },
  };
}

/**
 * Every card in one deck, laid out to be read rather than played.
 *
 * A fully server-rendered page: the roster is a constant, so this ships no
 * JavaScript at all beyond what the layout already needs. The Card table is
 * not consulted here — it holds what cards have *done*, and this page is
 * about what they *are*.
 */
export default async function DeckPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const game = getGame(slug);
  if (!game) notFound();

  const roster = rosterFor(slug);

  return (
    <main className="screen px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/games" className="muted text-sm underline underline-offset-4 hover:text-ink">
          All decks
        </Link>

        <header className="mt-4">
          <span
            aria-hidden
            className="grid h-16 w-16 place-items-center rounded-2xl text-4xl"
            style={{ background: game.tint }}
          >
            {game.emoji}
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold" style={{ color: game.ink }}>
            {game.name}
          </h1>
          <p className="muted mt-2 max-w-xl text-sm leading-relaxed">{game.blurb}</p>
        </header>

        {/* --------------------------- the triangle ------------------------ */}
        <section className="card mt-8 rounded-chunk p-5 sm:p-6" aria-labelledby="triangle-heading">
          <h2 id="triangle-heading" className="text-sm font-semibold">
            The triangle
          </h2>
          <p className="muted mt-1 text-xs leading-relaxed">
            Attacking the archetype you beat is worth half as much again. Being on the wrong side of
            it costs you a third.
          </p>

          <ol className="mt-4 flex flex-wrap items-center gap-2">
            {game.affinities.map((a, i) => (
              <li key={a.key} className="flex items-center gap-2">
                <span
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                  style={{ background: game.tint, color: game.ink }}
                >
                  <span aria-hidden>{a.emoji}</span>
                  {a.name}
                </span>
                <span aria-hidden className="muted text-xs">
                  {i === game.affinities.length - 1 ? "↩" : "beats"}
                </span>
              </li>
            ))}
            <li className="muted text-xs">back to {game.affinities[0].name}</li>
          </ol>

          <h3 className="mt-6 text-sm font-semibold">The six stats</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {game.stats.map((label) => (
              <li
                key={label}
                className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
              >
                {label}
              </li>
            ))}
          </ul>
          <p className="muted mt-3 text-xs leading-relaxed">
            Whichever one you attack with, their card defends with the same one.
          </p>
        </section>

        {/* ---------------------------- the cards -------------------------- */}
        {RARITIES.slice()
          .reverse()
          .map((rarity) => {
            const cards = cardsByRarity(slug, rarity);
            if (cards.length === 0) return null;
            return (
              <section key={rarity} className="mt-10" aria-labelledby={`r-${rarity}`}>
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 id={`r-${rarity}`} className="font-display text-lg font-bold capitalize">
                    {rarity}
                  </h2>
                  <p className="muted text-xs tabular-nums">
                    {cards.length} cards · {RARITY_BUDGET[rarity]} points each
                  </p>
                </div>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {cards.map((card) => (
                    <li key={card.id}>
                      <PlayingCard game={game} card={card} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

        {/* --------------------------- the events -------------------------- */}
        <section className="mt-12" aria-labelledby="events-heading">
          <h2 id="events-heading" className="font-display text-lg font-bold">
            Special events
          </h2>
          <p className="muted mt-1 text-xs leading-relaxed">
            One turns over every third round. They hit both sides equally, so an event can make a
            round strange but never decide it.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {roster.events.map((event) => (
              <li key={event.id} className="card flex items-start gap-3 rounded-2xl p-4">
                <span aria-hidden className="text-2xl leading-none">
                  {event.emoji}
                </span>
                <span>
                  <span className="block font-display text-sm font-bold">{event.name}</span>
                  <span className="muted text-xs leading-snug">{event.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------- the buttons ------------------------ */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link href={`/games/create?game=${slug}&mode=solo`} className="btn-primary w-full">
            Play the computer
          </Link>
          <Link
            href={`/games/create?game=${slug}`}
            className="btn-quiet w-full border border-line"
          >
            Open a table for two
          </Link>
        </div>

        <p className="muted mt-6 text-center text-xs leading-relaxed">
          You are dealt ten of these — four commons, three rares, two epics and a legend — so both
          decks are different and worth exactly the same.
        </p>
      </div>
    </main>
  );
}
