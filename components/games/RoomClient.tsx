"use client";

import Link from "next/link";
import { GAMES, getGame } from "@/lib/games/catalog";
import { useRoom } from "@/lib/games/useRoom";
import FinalStage from "./FinalStage";
import Lobby from "./Lobby";
import QuestionStage from "./QuestionStage";
import RevealStage from "./RevealStage";
import SeatForm from "./SeatForm";

/**
 * Everything that happens at /games/room/CODE.
 *
 * One poll loop, one state object, four screens chosen off `status`. Every
 * child that changes something server-side hands the response straight back
 * through `apply`, so a tap updates the screen without waiting for the next
 * poll to come round.
 */
export default function RoomClient({ code }: { code: string }) {
  const { state, error, msLeft, stale, apply } = useRoom(code);

  if (error) {
    return (
      <div className="card rounded-chunk p-8 text-center">
        <span aria-hidden className="block text-4xl">
          🚪
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">{error.message}</h1>
        <p className="muted mt-2 text-sm">
          Rooms are cleared a few hours after the last question.
        </p>
        <Link href="/games" className="btn-primary mt-6 inline-flex">
          Open a new one
        </Link>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="card animate-pop-in rounded-chunk p-8 text-center">
        <p className="muted text-sm">Finding room {code}…</p>
      </div>
    );
  }

  const game = getGame(state.gameSlug) ?? GAMES[0];

  // No seat in this room yet — either a fresh link, or a browser that has
  // lost its token. Same screen either way.
  if (!state.viewer) {
    return <SeatForm code={code} game={game} state={state} onSeated={apply} />;
  }

  return (
    <div className="space-y-5">
      {stale && (
        <p className="muted rounded-full bg-paper-tint px-4 py-2 text-center text-xs" role="status">
          Reconnecting…
        </p>
      )}

      {state.status === "lobby" && (
        <Lobby code={code} game={game} state={state} onState={apply} />
      )}

      {state.status === "question" && (
        // Keyed by round so the optimistic pick can never leak into the next
        // question if a poll and a transition land in the same tick.
        <QuestionStage
          key={state.round}
          code={code}
          game={game}
          state={state}
          msLeft={msLeft}
          onState={apply}
        />
      )}

      {state.status === "reveal" && (
        <RevealStage code={code} game={game} state={state} onState={apply} />
      )}

      {state.status === "finished" && (
        <FinalStage code={code} game={game} state={state} onState={apply} />
      )}
    </div>
  );
}
