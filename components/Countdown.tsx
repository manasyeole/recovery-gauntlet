"use client";

import { useEffect, useState } from "react";
import { daysUntil, SITE_CONFIG } from "@/lib/config";

/**
 * "Days until freedom" widget — the one genuinely useful thing on this site.
 * Computed after mount so the server's clock/timezone can't cause a
 * hydration mismatch. Renders nothing when NEXT_PUBLIC_FOLLOWUP_DATE is unset.
 */
export default function Countdown() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(daysUntil(SITE_CONFIG.followUpDate));
  }, []);

  if (!SITE_CONFIG.followUpDate || days === null) return null;

  const label =
    days > 1
      ? `${days} days until freedom`
      : days === 1
        ? "1 day until freedom"
        : days === 0
          ? "Freedom day is today 🎉"
          : `${Math.abs(days)} days past your follow-up — go outside`;

  return (
    <div
      className="card inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium"
      title={`Follow-up: ${SITE_CONFIG.followUpDate}`}
    >
      <span aria-hidden className="text-base">
        {days >= 0 ? "⏳" : "🚶"}
      </span>
      <span className="tabular-nums">{label}</span>
    </div>
  );
}
