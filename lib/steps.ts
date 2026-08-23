/**
 * THE 12 STEPS
 * ============
 * This array is the whole gauntlet. Edit the copy freely — the wizard,
 * progress bar, API and certificate all read from here.
 *
 * Four steps are marked `yourTurn: true` (4, 6, 7, 9). These are the
 * personalisation slots — they land fine as-is, but they get sharper with a
 * real inside joke. Search for "PERSONALISE ME".
 *
 * NOTE: `hint` renders on screen, under the question. Author notes belong in
 * comments, never in `hint` — a stray note there is visible to the visitor.
 *
 * `spotlight: true` marks answers worth quoting on the certificate screen.
 * `song` is the decorative couplet drawn behind the card (see SongLines).
 */

export type StepType =
  | "text" // single-line input
  | "longtext" // textarea
  | "number" // number input
  | "slider" // range slider with end labels
  | "choice" // list of tappable options
  | "yesno" // two big buttons
  | "confirm" // one big "I did it" button
  | "hold"; // hold-to-confirm for N seconds

export type StepKind = "greeting" | "tease" | "question" | "activity" | "closing";

/** Two lines of decorative type drawn behind the card. Never read aloud. */
export type SongLine = readonly [string, string];

export interface Step {
  number: number;
  kind: StepKind;
  type: StepType;
  emoji: string;
  /** The question text. This exact string is stored on the Answer row. */
  question: string;
  /** Small muted text under the question. */
  hint?: string;
  placeholder?: string;
  options?: string[];
  /**
   * `choice` only. When set, picking an option reveals this punchline instead
   * of advancing, and the visitor taps Continue themselves.
   */
  reveal?: string;
  /** slider / number only */
  min?: number;
  max?: number;
  /** slider only */
  minLabel?: string;
  maxLabel?: string;
  /** confirm / hold only — the button label */
  cta?: string;
  /** hold only */
  holdSeconds?: number;
  /** Can they skip it? Activities are skippable; real questions mostly aren't. */
  required?: boolean;
  /** Fire confetti when they complete this step. */
  confetti?: boolean;
  /** Quote this answer on the certificate. */
  spotlight?: boolean;
  /** Replace this one with your own material. */
  yourTurn?: boolean;
  /** Decorative background couplet for this step. */
  song: SongLine;
}

export const STEPS: Step[] = [
  {
    number: 1,
    kind: "greeting",
    type: "text",
    emoji: "🦵",
    question: "First things first — what should we call you?",
    hint: "Real name preferred. Nicknames will be used against you later.",
    placeholder: "Your name, survivor",
    required: true,
    song: ["first, your name,", "then your excuses"],
  },
  {
    number: 2,
    kind: "tease",
    type: "slider",
    emoji: "💊",
    question: "Your brain is working. The surgery was a success.",
    hint: "Now rate your pain. This meter has heard every lie before.",
    min: 0,
    max: 10,
    minLabel: "“fine”",
    maxLabel: "Call someone",
    required: true,
    song: ["turn it down,", "I can feel my pulse"],
  },
  {
    number: 3,
    kind: "question",
    type: "text",
    emoji: "🚪",
    question: "Which friend got to you before the swelling did?",
    hint: "One person. You know exactly who.",
    placeholder: "The one who brought crisps, not flowers",
    required: true,
    spotlight: true,
    song: ["somebody got here", "before the swelling did"],
  },

  // --- PERSONALISE ME (step 4) -------------------------------------------
  // The reveal is the whole joke. Swap in whatever the group chat actually
  // calls them — the three options are meant to all be wrong.
  // -----------------------------------------------------------------------
  {
    number: 4,
    kind: "tease",
    type: "choice",
    emoji: "📵",
    question: "What do your friends actually call you?",
    hint: "Pick carefully. There is one correct answer and you already know it.",
    options: ["Champ", "Warrior", "Legend"],
    reveal: "Wrong. It is “bitch”. Said with love, at volume, in the group chat.",
    required: true,
    yourTurn: true,
    song: ["they gave me a name", "and it stuck"],
  },

  {
    number: 5,
    kind: "tease",
    type: "text",
    emoji: "😂",
    question: "Funniest thing a friend has said about your leg?",
    hint: "Direct quote. They will deny it.",
    placeholder: "“At least now you have an excuse”",
    required: true,
    spotlight: true,
    song: ["you sang the wrong words", "and we let you"],
  },

  // --- PERSONALISE ME (step 6) -------------------------------------------
  // Name the actual family member if you can get away with it.
  // -----------------------------------------------------------------------
  {
    number: 6,
    kind: "question",
    type: "text",
    emoji: "📞",
    question: "Who in your family panicked hardest, and how fast?",
    hint: "Minutes, not hours. Be precise.",
    placeholder: "Mum, four minutes flat, by phone",
    required: true,
    yourTurn: true,
    song: ["four minutes flat,", "and the phone rang twice"],
  },

  // --- PERSONALISE ME (step 7) -------------------------------------------
  // Swap the placeholder for whatever actually gets cooked in their house.
  // -----------------------------------------------------------------------
  {
    number: 7,
    kind: "question",
    type: "text",
    emoji: "🍲",
    question: "Which family dish did more for you than the painkillers?",
    hint: "Credit where credit is due.",
    placeholder: "Rice, ghee, and unsolicited opinions",
    required: true,
    spotlight: true,
    yourTurn: true,
    song: ["the kitchen smelled", "like getting better"],
  },

  {
    number: 8,
    kind: "tease",
    type: "number",
    emoji: "🙂",
    question: "How many times did you say “I’m fine” today?",
    hint: "Each one costs you a point of credibility.",
    placeholder: "0",
    min: 0,
    max: 99,
    required: true,
    song: ["I said I was fine", "in eleven languages"],
  },

  // --- PERSONALISE ME (step 9) -------------------------------------------
  // Point the reveal at one specific unresolved household crime.
  // -----------------------------------------------------------------------
  {
    number: 9,
    kind: "tease",
    type: "choice",
    emoji: "🧦",
    question: "Who put the sock on the bad leg?",
    hint: "Justice requires a name.",
    options: ["Me. Heroically.", "Mum", "Nobody. Sock lost."],
    reveal: "It was gravity, and it took four minutes. We have footage.",
    required: true,
    yourTurn: true,
    song: ["gravity took the sock", "and took its time"],
  },

  {
    number: 10,
    kind: "question",
    type: "text",
    emoji: "☀️",
    question: "Best thing that happened this week. It does not have to be big.",
    hint: "Small counts. Small is the whole point.",
    placeholder: "Sat outside for eleven whole minutes",
    required: true,
    spotlight: true,
    confetti: true,
    song: ["eleven minutes of weather", "and I took it"],
  },
  {
    number: 11,
    kind: "question",
    type: "text",
    emoji: "🎧",
    question: "What song have you had on repeat since it happened?",
    hint: "This one goes on the certificate. Pick something you would defend.",
    placeholder: "The loud one, obviously",
    required: true,
    spotlight: true,
    song: ["turn it up,", "I can’t feel my knee"],
  },
  {
    number: 12,
    kind: "closing",
    type: "text",
    emoji: "🎓",
    question: "One line of advice for the next unlucky soul.",
    hint: "This goes on your certificate. Choose wisely.",
    placeholder: "Say yes to the pillow, say no to the stairs",
    required: true,
    confetti: true,
    spotlight: true,
    song: ["call it a comeback,", "call it a limp"],
  },
];

export const TOTAL_STEPS = STEPS.length;

/** Decorative couplets for the screens that aren't a step. */
export const LANDING_SONG: SongLine = ["and the leg said no,", "but the heart said one more"];
export const CERTIFICATE_SONG: SongLine = ["six weeks of ceiling,", "one week of sky"];

export function getStep(n: number): Step | undefined {
  return STEPS.find((s) => s.number === n);
}

/** Steps whose answers are quoted on the certificate. */
export const SPOTLIGHT_STEPS = STEPS.filter((s) => s.spotlight).map((s) => s.number);

/** The step that doubles as the visitor's name field. */
export const NAME_STEP = 1;

/**
 * A pale tint per step, cycled, so consecutive screens feel distinct. Shared
 * by the card's emoji tile and the wash behind it.
 */
const TINTS = ["bg-clay-50", "bg-tint-sage", "bg-tint-sky", "bg-tint-butter"] as const;

export function tintFor(stepNumber: number): (typeof TINTS)[number] {
  return TINTS[(stepNumber - 1) % TINTS.length];
}

/** Short labels for the admin table and certificate, so long questions don't wreck layout. */
export const SHORT_LABELS: Record<number, string> = {
  1: "Name",
  2: "Pain level",
  3: "Friend who got there first",
  4: "What friends call them",
  5: "Funniest thing a friend said",
  6: "Who panicked hardest",
  7: "The family dish",
  8: "Times they said “I’m fine”",
  9: "Who put the sock on",
  10: "Best thing this week",
  11: "Song on repeat",
  12: "Advice for the next soul",
};

export function labelFor(stepNumber: number): string {
  return SHORT_LABELS[stepNumber] ?? `Step ${stepNumber}`;
}
