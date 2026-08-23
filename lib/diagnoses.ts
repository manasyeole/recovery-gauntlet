/**
 * Joke "official diagnoses" printed on the certificate.
 * Picked deterministically from the session id so a given person always
 * gets the same one — re-rolling on every render would make the shareable
 * image inconsistent.
 */
export const DIAGNOSES: string[] = [
  "Acute Overconfidence of the Lower Limb",
  "Severe Main-Character Syndrome (Load-Bearing)",
  "Gravity-Assisted Career Change",
  "Chronic 'I Can Make That Jump' Disorder",
  "Bilateral Poor Decision Making, Unilateral Consequences",
  "Advanced Horizontal Lifestyle Adaptation",
  "Post-Traumatic Pillow Dependency",
  "Recreational Physics Miscalculation",
  "Stage IV Dramatic Retelling",
  "Idiopathic Furniture-Grabbing Reflex",
  "Complete Rupture of the Group Trip Itinerary",
  "Non-Displaced Ego, Displaced Everything Else",
];

export const PROGNOSES: string[] = [
  "Full recovery expected. Judgement: permanent.",
  "Prognosis good. Reputation guarded.",
  "Expected to walk again. Expected to learn nothing.",
  "Recovery likely. Recurrence extremely likely.",
  "Cleared for couch duty until further notice.",
  "Will be fine. Will not stop talking about it.",
];

/** Stable hash so the same session always gets the same joke. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function pickDiagnosis(seed: string): string {
  return DIAGNOSES[hash(seed) % DIAGNOSES.length];
}

export function pickPrognosis(seed: string): string {
  return PROGNOSES[hash(`${seed}:prognosis`) % PROGNOSES.length];
}

/** Certificate serial number, e.g. "RG-4F2A-0007". */
export function certificateSerial(seed: string): string {
  const h = hash(seed).toString(16).toUpperCase().padStart(6, "0");
  return `RG-${h.slice(0, 4)}-${h.slice(-4)}`;
}
