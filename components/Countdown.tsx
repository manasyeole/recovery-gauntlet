"use client";

import { useEffect, useState } from "react";
import { daysUntil, SITE_CONFIG } from "@/lib/config";

/**
 * Days-until-follow-up widget. Computed after mount so the server's clock
 * can't cause a hydration mismatch. Renders nothing when the date is unset.
 */
export default function Countdown() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(daysUntil(SITE_CONFIG.followUpDate));
  }, []);

  if (!SITE_CONFIG.followUpDate || days === null) return null;

  return (
    <p className="muted text-sm tabular-nums">
      {days > 0
        ? `${days} ${days === 1 ? "day" : "days"} until your follow-up.`
        : days === 0
          ? "Follow-up is today."
          : `${Math.abs(days)} days past your follow-up.`}
    </p>
  );
}
