"use client";

import { useEffect, useState } from "react";

/**
 * The code, big, plus the two ways people actually pass it around: the native
 * share sheet on a phone, the clipboard everywhere else.
 */
export default function RoomCode({ code, accent }: { code: string; accent: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // navigator.share only exists on some clients, and only over https — so the
  // button is decided after mount rather than guessed during render.
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);

  const link = typeof window === "undefined" ? "" : `${window.location.origin}/games/room/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Clipboard denied — the code is on screen in 32px type, which is the
      // fallback that has always worked.
    }
  }

  async function share() {
    try {
      await navigator.share({ title: "Join my room", text: `Room code: ${code}`, url: link });
    } catch {
      /* dismissed */
    }
  }

  return (
    <div className="text-center">
      <p className="muted text-xs font-semibold uppercase tracking-widest">Room code</p>
      <p
        className="mt-1 font-display text-4xl font-bold tracking-[0.3em] sm:text-5xl"
        style={{ color: accent }}
      >
        {code}
      </p>

      <div className="mt-4 flex justify-center gap-2">
        <button type="button" onClick={copy} className="btn-quiet border border-line">
          {copied ? "Link copied" : "Copy link"}
        </button>
        {canShare && (
          <button type="button" onClick={share} className="btn-quiet border border-line">
            Share
          </button>
        )}
      </div>
    </div>
  );
}
