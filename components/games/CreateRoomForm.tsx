"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GAMES, getGame } from "@/lib/games/catalog";
import { createRoom, lastEmoji, lastName } from "@/lib/games/client";
import {
  AVATARS,
  cleanName,
  isValidName,
  ROUND_SECONDS_CHOICES,
  TOTAL_ROUNDS_CHOICES,
} from "@/lib/games/protocol";
import { questionCount } from "@/lib/games/questions";
import IdentityFields from "./IdentityFields";

/**
 * The create screen. Everything the room needs is decided here and nowhere
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
  const [rounds, setRounds] = useState<number>(10);
  const [seconds, setSeconds] = useState<number>(20);

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
  const available = questionCount(game.slug);
  const cleaned = cleanName(name);
  const ready = isValidName(cleaned) && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { code } = await createRoom({
        gameSlug: game.slug,
        name: cleaned,
        emoji,
        totalRounds: rounds,
        roundSeconds: seconds,
      });
      router.push(`/games/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open a room.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* --------------------------- the game --------------------------- */}
      <section className="card rounded-chunk p-5 sm:p-7">
        <h2 className="font-display text-lg font-bold">Which game?</h2>
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
      </section>

      {/* ---------------------------- you ------------------------------- */}
      <section className="card rounded-chunk p-5 sm:p-7">
        <IdentityFields name={name} emoji={emoji} onName={setName} onEmoji={setEmoji} />
      </section>

      {/* --------------------------- length ----------------------------- */}
      <section className="card rounded-chunk p-5 sm:p-7">
        <h2 className="font-display text-lg font-bold">How long?</h2>

        <Choices
          label="Questions"
          options={TOTAL_ROUNDS_CHOICES}
          value={rounds}
          onChange={setRounds}
          // Never offer more rounds than the bank can fill.
          disabledAbove={available}
          suffix=""
        />
        <Choices
          label="Seconds each"
          options={ROUND_SECONDS_CHOICES}
          value={seconds}
          onChange={setSeconds}
          suffix="s"
        />

        {rounds > available && (
          <p className="muted mt-3 text-xs">
            {game.name} has {available} questions, so the room will run {available}.
          </p>
        )}
      </section>

      {error && (
        <p className="animate-nudge rounded-2xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={!ready} className="btn-primary w-full">
        {busy ? "Opening the room" : "Open the room"}
      </button>

      <p className="muted text-center text-xs">
        You get a six-character code. Anyone with it can join — no accounts, nothing to install.
      </p>
    </form>
  );
}

function Choices({
  label,
  options,
  value,
  onChange,
  suffix,
  disabledAbove,
}: {
  label: string;
  options: readonly number[];
  value: number;
  onChange: (n: number) => void;
  suffix: string;
  disabledAbove?: number;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="flex gap-2">
        {options.map((n) => {
          const tooMany = disabledAbove !== undefined && n > disabledAbove;
          const on = n === value;
          return (
            <button
              key={n}
              type="button"
              disabled={tooMany}
              onClick={() => onChange(n)}
              aria-pressed={on}
              className={`tap flex-1 rounded-2xl border text-sm font-semibold tabular-nums
                transition active:scale-[0.98] disabled:opacity-30 ${
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
