"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConfetti } from "./Confetti";
import { SITE_CONFIG } from "@/lib/config";
import { getVisitorName, resetRun } from "@/lib/client";

/**
 * The closing screen: every sport she is not doing this month, laid out as a
 * wall to look at. Emoji rather than photographs — it is the app's whole
 * illustration system, and it needs no assets, no licensing and no network.
 */
const SPORTS = [
  { emoji: "🏃‍♀️", label: "Running" },
  { emoji: "🚶", label: "Walking" },
  { emoji: "⛸️", label: "Ice skating" },
  { emoji: "🛼", label: "Roller skating" },
  { emoji: "🛹", label: "Skateboarding" },
  { emoji: "🚴", label: "Cycling" },
  { emoji: "🏊", label: "Swimming" },
  { emoji: "⛷️", label: "Skiing" },
  { emoji: "🤸", label: "Gymnastics" },
  { emoji: "⚽", label: "Football" },
  { emoji: "🏀", label: "Basketball" },
  { emoji: "🎾", label: "Tennis" },
] as const;

/** Cycled so the grid reads as a scatter rather than a table. */
const TILTS = [-6, 4, -3, 7, -5, 2];

export default function FinishLine() {
  const burst = useConfetti();
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setName(getVisitorName() || SITE_CONFIG.friendName);
    setReady(true);
    burst("big");
  }, [burst]);

  // Rendered after mount so a stored name can't cause a hydration mismatch.
  if (!ready) return <div className="screen" />;

  return (
    <div className="w-full max-w-xl">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-clay-500">
        Assessment complete
      </p>

      <h1 className="mt-5 text-balance text-center font-display text-4xl font-bold leading-tight">
        The world is still running, {name}.
      </h1>

      <p className="muted mt-4 text-center text-lg leading-relaxed">
        Here is everything it is doing without you this month. Have a good long look.
      </p>

      <ul className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {SPORTS.map((sport, i) => (
          <li
            key={sport.label}
            className="card animate-pop-in grid aspect-square place-items-center rounded-chunk text-4xl sm:text-5xl"
            style={{
              transform: `rotate(${TILTS[i % TILTS.length]}deg)`,
              animationDelay: `${i * 45}ms`,
            }}
          >
            <span role="img" aria-label={sport.label} title={sport.label}>
              {sport.emoji}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-center font-display text-xl font-bold">
        Every one of these will wait. None of them are going anywhere.
      </p>

      <p className="muted mt-2 text-center text-sm leading-relaxed">
        Rest is still scared of you. Let it stay that way for six more weeks.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            resetRun();
            window.location.href = "/";
          }}
          className="btn-primary"
        >
          Go again
        </button>
        <Link href="/gauntlet" className="btn-quiet">
          Back to my answers
        </Link>
      </div>
    </div>
  );
}
