"use client";

import { useEffect, useState } from "react";
import type { Game } from "@/lib/games/catalog";
import { joinRoom, lastEmoji, lastName } from "@/lib/games/client";
import { AVATARS, cleanName, isValidName, type RoomState } from "@/lib/games/protocol";
import IdentityFields from "./IdentityFields";

/**
 * Taking a seat in a room you already have the code for.
 *
 * This is the whole door policy. Whoever opens the link can play — the code
 * is the credential, which is the right amount of security for a quiz among
 * friends and no amount at all for anything else.
 */
export default function SeatForm({
  code,
  game,
  state,
  onSeated,
}: {
  code: string;
  game: Game;
  state: RoomState;
  onSeated: (next: RoomState) => void;
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
  const ready = isValidName(cleaned) && !busy;
  const inProgress = state.status === "question" || state.status === "reveal";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { state: next } = await joinRoom(code, { name: cleaned, emoji });
      onSeated(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join that room.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card rounded-chunk p-6 sm:p-8">
      <span
        aria-hidden
        className="grid h-14 w-14 place-items-center rounded-2xl text-3xl"
        style={{ background: game.tint }}
      >
        {game.emoji}
      </span>

      <h1 className="mt-4 font-display text-2xl font-bold">
        Join the {game.name} room
      </h1>
      <p className="muted mt-1.5 text-sm">
        {state.players.length === 0
          ? "You'll be first in."
          : `${state.players.length} already in: ${state.players.map((p) => p.name).join(", ")}`}
      </p>

      {inProgress && (
        <p className="mt-4 rounded-2xl bg-tint-butter px-4 py-3 text-sm">
          This game is already on question {state.round} of {state.totalRounds}. You can join now,
          but you'll start on nothing.
        </p>
      )}

      <div className="mt-6">
        <IdentityFields name={name} emoji={emoji} onName={setName} onEmoji={setEmoji} autoFocus />
      </div>

      {error && (
        <p className="animate-nudge mt-5 rounded-2xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={!ready} className="btn-primary mt-6 w-full">
        {busy ? "Joining" : "Take a seat"}
      </button>
    </form>
  );
}
