/**
 * SITE_CONFIG — the one place to re-skin this site for the next friend
 * who decides gravity is optional.
 *
 * Every value falls back to a sane default, so the site boots with zero
 * env vars set. Override in `.env.local` (or Vercel → Settings → Env Vars).
 * NEXT_PUBLIC_* vars are inlined at build time, so redeploy after changing.
 */
export const SITE_CONFIG = {
  /** Whose leg is it anyway. Overridden per-visitor by ?name= or step 1. */
  friendName: process.env.NEXT_PUBLIC_FRIEND_NAME || "Champ",
  /** e.g. "leg surgery", "a shattered fibula", "an ACL tear" */
  injury: process.env.NEXT_PUBLIC_INJURY || "leg surgery",
  /** ISO date (YYYY-MM-DD) of the surgery / incident. */
  surgeryDate: process.env.NEXT_PUBLIC_SURGERY_DATE || "",
  /** ISO date of the follow-up / cast-off appointment. Blank hides the countdown. */
  followUpDate: process.env.NEXT_PUBLIC_FOLLOWUP_DATE || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",

  totalSteps: 20,

  copy: {
    title: "The Recovery Gauntlet",
    tagline: "20 steps between you and your Certificate of Successful Suffering.",
    subhead: "How did you even manage this.",
    startCta: "Start the Gauntlet",
  },
} as const;

/** Whole days from today until `iso`. Negative once the date has passed. */
export function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const target = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b - a) / 86_400_000);
}

/** Whole days since `iso`. Null if unset/invalid. */
export function daysSince(iso: string): number | null {
  const d = daysUntil(iso);
  return d === null ? null : -d;
}
