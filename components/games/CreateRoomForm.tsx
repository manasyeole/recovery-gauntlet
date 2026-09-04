"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GAMES, getGame } from "@/lib/games/catalog";
import { cardCount } from "@/lib/games/cards";
import { createDuel, lastEmoji, lastName } from "@/lib/games/client";
import {
  AVATARS,
  cleanName,
  DIFFICULTIES,
  isValidName,
  MAX_ROUNDS_CHOICES,
  TURN_SECONDS_CHOICES,
  type Difficulty,
} from "@/lib/games/protocol";
import IdentityFields from "./IdentityFields";

const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  easy: "Plays roughly the right card, often on the wrong stat.",
  normal: "Knows what its cards are good at. Doesn't watch what you play.",
  hard: "Counts the cards you've already used and goes for the kill.",
};

/**
 * The create screen. Everything the duel needs is decided here and nowhere
 * else, so the lobby has nothing to configure and the host can hand out the
 * code the moment it exists.
 */
export default function CreateRoomForm() {
  const router = useRouter();
  const params = useSearchParams();

  const preselected = getGame(params.get("game"))?.slug ?? GAMES[0].slug;
  const [slug, setSlug] = useState(preselected);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>(AVATARS[0]);
  const [solo, setSolo] = useState(params.get("mode") === "solo");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [rounds, setRounds] = useState<number>(12);
  const [seconds, setSeconds] = useState<number>(25);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Regulars shouldn't retype their name every evening. Read after mount so
  // the server-rendered markup and the first client render agree.
  useEffect(() => {
    setName(lastName());
    const saved = lastEmoji();
    if (saved) setEmoji(saved);
  }, []);

  const game = getGame(slug) ?? GAMES[0];
  const cleaned = cleanName(name);
  const ready = isValidName(cleaned) && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { code } = await createDuel({
        gameSlug: game.slug,
        name: cleaned,
        emoji,
        mode: solo ? "solo" : "room",
        difficulty,
        maxRounds: rounds,
        turnSeconds: seconds,
      });
      router.push(`/games/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open a duel.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* --------------------------- the deck ---------------------------- */}
      <section className="card rounded-chunk p-5 sm:p-7">
        <h2 className="font-display text-lg font-bold">Which deck?</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GAMES.map((g) => {
            const on = g.slug === game.slug;
            return (
              <button
                key={g.slug}
                type="button"
                onClick={() => setSlug(g.slug)}
                aria-pressed={on}
                className="tap flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3
                  text-center text-xs font-semibold transition active:scale-[0.98]"
                style={{
                  borderColor: on ? g.accent : "var(--line)",
                  background: on ? g.tint : "var(--card)",
                  color: on ? g.ink : "var(--ink-soft)",
                }}
              >
                <span aria-hidden className="text-2xl">
                  {g.emoji}
                </span>
                {g.name}
              </button>
            );
          })}
        </div>
        <p className="muted mt-4 text-sm leading-relaxed">{game.blurb}</p>
        <p className="mt-3 text-xs font-semibold" style={{ color: game.accent }}>
          {cardCount(game.slug)} cards · {game.stats.join(" · ")}
        </p>
      </section>

      {/* -------------------------- the opponent -------------------------- */}
      <section className="card rounded-chunk p-5 sm:p-7">
        <h2 className="font-display text-lg font-bold">Against who?</h2>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Toggle on={solo} onClick={() => setSolo(true)} title="The computer" sub="Starts now" />
          <Toggle
            on={!solo}
            onClick={() => setSolo(false)}
            title="A friend"
            sub="You get a code"
          />
        </div>

        {solo && (
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold">How hard?</legend>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => {
                const on = d === difficulty;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    aria-pressed={on}
                    className={`tap flex-1 rounded-2xl border text-sm font-semibold capitalize
                      transition active:scale-[0.98] ${
                        on
                          ? "border-clay-500 bg-clay-50 text-clay-600"
                          : "border-line bg-card hover:border-clay-300"
                      }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <p className="muted mt-2 text-xs leading-relaxed">{DIFFICULTY_BLURB[difficulty]}</p>
          </fieldset>
        )}
      </section>

      {/* ------------------------------- you ------------------------------ */}
      <section className="card rounded-chunk p-5 sm:p-7">
        <IdentityFields name={name} emoji={emoji} onName={setName} onEmoji={setEmoji} />
      </section>

      {/* ----------------------------- length ----------------------------- */}
      <section className="card rounded-chunk p-5 sm:p-7">
        <h2 className="font-display text-lg font-bold">How long?</h2>

        <Choices label="Rounds at most" options={MAX_ROUNDS_CHOICES} value={rounds} onChange={setRounds} suffix="" />
        <Choices
          label="Seconds a turn"
          options={TURN_SECONDS_CHOICES}
          value={seconds}
          onChange={setSeconds}
          suffix="s"
        />

        <p className="muted mt-4 text-xs leading-relaxed">
          Most duels end on a knockout well before the rounds run out. If nobody drops, it goes on
          health.
        </p>
      </section>

      {error && (
        <p className="animate-nudge rounded-2xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={!ready} className="btn-primary w-full">
        {busy ? "Dealing" : solo ? "Deal the cards" : "Open the table"}
      </button>

      <p className="muted text-center text-xs">
        {solo
          ? "Nothing to share and nothing to install — the computer is already sitting down."
          : "You get a six-character code. Whoever has it takes the other chair."}
      </p>
    </form>
  );
}

function Toggle({
  on,
  onClick,
  title,
  sub,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`tap rounded-2xl border px-3 py-3 text-left transition active:scale-[0.98] ${
        on ? "border-clay-500 bg-clay-50" : "border-line bg-card hover:border-clay-300"
      }`}
    >
      <span className={`block text-sm font-semibold ${on ? "text-clay-600" : ""}`}>{title}</span>
      <span className="muted block text-xs">{sub}</span>
    </button>
  );
}

function Choices({
  label,
  options,
  value,
  onChange,
  suffix,
}: {
  label: string;
  options: readonly number[];
  value: number;
  onChange: (n: number) => void;
  suffix: string;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="flex gap-2">
        {options.map((n) => {
          const on = n === value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={on}
              className={`tap flex-1 rounded-2xl border text-sm font-semibold tabular-nums
                transition active:scale-[0.98] ${
                  on
                    ? "border-clay-500 bg-clay-50 text-clay-600"
                    : "border-line bg-card hover:border-clay-300"
                }`}
            >
              {n}
              {suffix}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
