"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, fetchState } from "./client";
import type { RoomState } from "./protocol";

/**
 * Keeps one browser in step with a room.
 *
 * Polling, not sockets. The room is a handful of players on hotel wifi and
 * the host is on Vercel's serverless runtime, where a long-lived connection
 * is the awkward option and a 1.2-second GET is the boring one. Cadence is
 * tied to what is on screen — a lobby does not need the same attention as a
 * live question — and the tab going to the background stops it entirely.
 */

const INTERVALS: Record<RoomState["status"], number> = {
  lobby: 2000,
  question: 1200,
  reveal: 1200,
  finished: 6000,
};

/** How long a phase boundary is worth waking up early for. */
const BOUNDARY_LEAD_MS = 200;

export interface UseRoom {
  state: RoomState | null;
  /** Fatal — the room is gone or the server is down. */
  error: { code: string; message: string } | null;
  /** Milliseconds left in the phase, ticking locally between polls. */
  msLeft: number;
  /** True once a poll has failed but before we give up on it. */
  stale: boolean;
  /** Push a state we already received (e.g. the response to an answer). */
  apply: (next: RoomState) => void;
  refresh: () => void;
}

export function useRoom(code: string, enabled = true): UseRoom {
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [stale, setStale] = useState(false);

  // When the current state was received, so the countdown can run locally
  // instead of jumping in whole poll-sized steps.
  const receivedAt = useRef(0);
  const [, forceTick] = useState(0);

  const apply = useCallback((next: RoomState) => {
    receivedAt.current = Date.now();
    setState(next);
    setStale(false);
    setError(null);
  }, []);

  /* ------------------------------ polling ------------------------------ */

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  // Read inside the poll loop without making it a dependency, so changing
  // phase doesn't tear down and rebuild the whole schedule.
  const latest = useRef<RoomState | null>(null);
  latest.current = state;

  const poll = useCallback(async () => {
    if (!alive.current) return;
    try {
      const { state: next } = await fetchState(code);
      if (!alive.current) return;
      apply(next);
    } catch (err) {
      if (!alive.current) return;
      // A missing room is final; anything else is probably the network and
      // worth another go, so the UI only greys out rather than giving up.
      if (err instanceof ApiError && (err.status === 404 || err.code === "no_database")) {
        setError({ code: err.code, message: err.message });
        return;
      }
      setStale(true);
    }

    if (!alive.current) return;
    // A backgrounded tab stops asking; visibilitychange restarts it.
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

    const current = latest.current;
    const base = current ? INTERVALS[current.status] : 2000;
    const remaining = current
      ? Math.max(0, current.msLeft - (Date.now() - receivedAt.current))
      : 0;
    // Wake just after a phase is due to flip, rather than up to a full
    // interval late — the reveal landing a second after the buzzer is the
    // difference between a game and a spreadsheet.
    const delay = remaining > 0 ? Math.min(base, remaining + BOUNDARY_LEAD_MS) : base;
    timer.current = setTimeout(poll, Math.max(400, delay));
  }, [code, apply]);

  useEffect(() => {
    if (!enabled || !code) return;
    alive.current = true;
    void poll();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (timer.current) clearTimeout(timer.current);
        void poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [code, enabled, poll]);

  /* ----------------------------- local clock --------------------------- */

  const running = state?.status === "question" || state?.status === "reveal";

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => forceTick((n) => n + 1), 100);
    return () => clearInterval(id);
  }, [running]);

  const msLeft = state
    ? Math.max(0, state.msLeft - (Date.now() - receivedAt.current))
    : 0;

  return { state, error, msLeft, stale, apply, refresh: () => void poll() };
}
