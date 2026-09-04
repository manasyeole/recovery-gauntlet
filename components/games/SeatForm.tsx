"use client";

import { useEffect, useState } from "react";
import type { Game } from "@/lib/games/catalog";
import { joinDuel, lastEmoji, lastName } from "@/lib/games/client";
import { AVATARS, cleanName, isValidName, SEATS, type DuelState } from "@/lib/games/protocol";
import IdentityFields from "./IdentityFields";

/**
 * Taking the other chair in a duel you already have the code for.
 *
 * This is the whole door policy. Whoever opens the link can play — the code
 * is the credential, which is the right amount of security for a card game
 * among friends and no amount at all for anything else.
 */
export default function SeatForm({
  code,
  game,
  state,
  onSeated,
}: {
  code: string;
  game: Game;
  state: DuelState;
  onSeated: (next: DuelState) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>(AVATARS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(lastName());
    const saved = lastEmoji();
    if (saved) setEmoji(saved);
  }, []);

  const cleaned = cleanName(name);
  const full = state.duelists.length >= SEATS;
  const closed = state.mode === "solo" || full || state.status !== "lobby";
  const ready = isValidName(cleaned) && !busy && !closed;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { state: next } = await joinDuel(code, { name: cleaned, emoji });
      onSeated(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join that duel.");
      setBusy(false);
    }
  }

  // A duel is exactly two chairs, so "no room" is a real and common answer
  // here rather than an edge case — say it plainly instead of failing on
  // submit after they have typed a name.
  const shut =
    state.mode === "solo"
      ? "This duel is against the computer."
      : full
        ? "Both chairs are taken. A duel is two people."
        : state.status === "finished"
          ? "That duel is already over."
          : "That duel is already under way.";

  return (
    <form onSubmit={submit} className="card rounded-chunk p-6 sm:p-8">
      <span
        aria-hidden
        className="grid h-14 w-14 place-items-center rounded-2xl text-3xl"
        style={{ background: game.tint }}
      >
        {game.emoji}
      </span>

      <h1 className="mt-4 font-display text-2xl font-bold">Sit down · {game.name}</h1>
      <p className="muted mt-1.5 text-sm">
        {state.duelists.length === 0
          ? "Nobody here yet."
          : `${state.duelists.map((d) => d.name).join(" is waiting")} is waiting.`}
      </p>

      {closed ? (
        <p className="mt-5 rounded-2xl bg-tint-butter px-4 py-4 text-sm">{shut}</p>
      ) : (
        <div className="mt-6">
          <IdentityFields name={name} emoji={emoji} onName={setName} onEmoji={setEmoji} autoFocus />
        </div>
      )}

      {error && (
        <p className="animate-nudge mt-5 rounded-2xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      {!closed && (
        <button type="submit" disabled={!ready} className="btn-primary mt-6 w-full">
          {busy ? "Sitting down" : "Take the chair"}
        </button>
      )}
    </form>
  );
}
