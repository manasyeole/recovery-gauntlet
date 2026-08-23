/**
 * THE 13 STEPS
 * ============
 * This array is the whole gauntlet. Edit the copy freely — the wizard,
 * progress bar, API and closing screen all read from here.
 *
 * Four steps are marked `yourTurn: true` (4, 5, 7, 9). These are the
 * personalisation slots — they land fine as-is, but they get sharper with a
 * real inside joke. Search for "PERSONALISE ME".
 *
 * NOTE: `hint` renders on screen, under the question. Author notes belong in
 * comments, never in `hint` — a stray note there is visible to the visitor.
 *
 * `spotlight: true` is kept for a future recap screen; nothing reads it now.
 * `song` is the decorative couplet drawn behind the card (see SongLines).
 */

export type StepType =
  | "text" // single-line input
  | "longtext" // textarea
  | "number" // number input
  | "slider" // range slider with end labels
  | "choice" // list of tappable options
  | "yesno" // two big buttons
  | "guesses" // a row of text boxes, then a punchline
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
   * `choice` / `yesno` / `guesses`. When set, the visitor gets this punchline
   * once they've committed, and taps Continue themselves instead of the step
   * auto-advancing.
   */
  reveal?: string;
  /**
   * `choice` / `yesno`. Records this answer no matter which option they tap —
   * and highlights it, which is the joke. Use sparingly; it is a lie.
   */
  forceAnswer?: string;
  /** `guesses` only — how many boxes. Defaults to 3. */
  guessCount?: number;
  /** slider / number only */
  min?: number;
  max?: number;
  /** slider only */
  minLabel?: string;
  maxLabel?: string;
  /** confirm / hold only — the button label */
  cta?: string;
  /** `confirm` only — what the button says once pressed. */
  confirmedLabel?: string;
  /** hold only */
  holdSeconds?: number;
  /** Can they skip it? Activities are skippable; real questions mostly aren't. */
  required?: boolean;
  /** Fire confetti when they complete this step. */
  confetti?: boolean;
  /** Reserved for a recap screen. Currently unused. */
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
    question: "First things first — what do we call you?",
    hint: "Real name preferred.",
    placeholder: "Your name, survivor",
    required: true,
    song: ["first, your name,", "then your excuses"],
  },
  {
    number: 2,
    kind: "tease",
    type: "yesno",
    emoji: "💊",
    question: "Your brain is working?",
    hint: "Be honest. There is a right answer and it isn’t the flattering one.",
    forceAnswer: "No",
    reveal: "Recorded as No — whichever one you tapped. Laughing at how honest that was.",
    required: true,
    song: ["nobody’s home", "but the lights are on"],
  },
  {
    number: 3,
    kind: "tease",
    type: "slider",
    emoji: "🩺",
    question: "The surgery was a success.",
    hint: "Now rate your pain. This meter has heard every lie before.",
    min: 0,
    max: 10,
    minLabel: "“Fine”",
    maxLabel: "Call someone",
    required: true,
    song: ["turn it down,", "I can feel my pulse"],
  },

  // --- PERSONALISE ME (step 4) -------------------------------------------
  // Works as a general dig. Point it at one specific friend if you have one.
  // -----------------------------------------------------------------------
  {
    number: 4,
    kind: "tease",
    type: "text",
    emoji: "🚪",
    question: "Which friend is worse on their legs than you?",
    hint: "Somebody has to be. Name them.",
    placeholder: "Be specific. They will hear about this.",
    required: true,
    spotlight: true,
    yourTurn: true,
    song: ["we are all limping,", "some of us louder"],
  },

  // --- PERSONALISE ME (step 5) -------------------------------------------
  // Three guesses, all wrong by design. Swap the reveal for whatever the
  // group chat actually calls them.
  // -----------------------------------------------------------------------
  {
    number: 5,
    kind: "tease",
    type: "guesses",
    emoji: "📵",
    question: "What do your friends actually call you?",
    hint: "Three guesses. All three will be wrong.",
    guessCount: 3,
    reveal: "Wrong. It is “bitch”. Said with love, at volume, in the group chat.",
    required: true,
    yourTurn: true,
    song: ["they gave me a name", "and it stuck"],
  },

  {
    number: 6,
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

  // --- PERSONALISE ME (step 7) -------------------------------------------
  // Swap in the actual brand name if the answer is funnier that way.
  // -----------------------------------------------------------------------
  {
    number: 7,
    kind: "question",
    type: "text",
    emoji: "🍲",
    question: "Do the painkillers actually work on you?",
    hint: "No wrong answers. Several incriminating ones.",
    placeholder: "Define “work”",
    required: true,
    spotlight: true,
    yourTurn: true,
    song: ["two in the morning,", "still counting ceiling tiles"],
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
  // The absurd one. Leave it deadpan — the joke is that it's asked at all.
  // -----------------------------------------------------------------------
  {
    number: 9,
    kind: "tease",
    type: "text",
    emoji: "🧦",
    question: "How to run?",
    hint: "You knew this once. Walk us through it.",
    placeholder: "Step one…",
    required: true,
    spotlight: true,
    yourTurn: true,
    song: ["I knew this once,", "I wrote it down somewhere"],
  },

  {
    number: 10,
    kind: "question",
    type: "text",
    emoji: "☀️",
    question: "Best thing that happened this week?",
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
    hint: "This one is going in the permanent record. Pick something you would defend.",
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
    question: "One line of advice for the next unlucky soul who can’t stand on her own two legs?",
    hint: "This is the one they will read back to you. Choose wisely.",
    placeholder: "Say yes to the pillow, say no to the stairs",
    required: true,
    spotlight: true,
    song: ["call it a comeback,", "call it a limp"],
  },
  {
    number: 13,
    kind: "closing",
    type: "confirm",
    emoji: "🐒",
    question: "See? Talking to yourself already.",
    hint: "Don’t take rest. Rest is already scared of you.",
    cta: "JUST RUNNNNN",
    confirmedLabel: "oh. You can’t.",
    confetti: true,
    song: ["rest is scared of you,", "and so are the stairs"],
  },
];

export const TOTAL_STEPS = STEPS.length;

/** Decorative couplets for the screens that aren't a step. */
export const LANDING_SONG: SongLine = ["and the leg said no,", "but the heart said one more"];
export const FINISH_SONG: SongLine = ["the world went running", "and left the door open"];

export function getStep(n: number): Step | undefined {
  return STEPS.find((s) => s.number === n);
}

/** The step that doubles as the visitor's name field. */
export const NAME_STEP = 1;

/** The advice step. Kept for a future recap screen. */
export const ADVICE_STEP = 12;

/** Steps flagged as quotable. Kept for a future recap screen. */
export const SPOTLIGHT_STEPS = STEPS.filter((s) => s.spotlight).map((s) => s.number);

/**
 * A pale tint per step, cycled, so consecutive screens feel distinct. Shared
 * by the card's emoji tile and the wash behind it.
 */
const TINTS = ["bg-clay-50", "bg-tint-sage", "bg-tint-sky", "bg-tint-butter"] as const;

export function tintFor(stepNumber: number): (typeof TINTS)[number] {
  return TINTS[(stepNumber - 1) % TINTS.length];
}

/** Short labels for the admin table, so long questions don't wreck layout. */
export const SHORT_LABELS: Record<number, string> = {
  1: "Name",
  2: "Is the brain working",
  3: "Pain level",
  4: "Friend with worse legs",
  5: "Guesses at the nickname",
  6: "Funniest thing a friend said",
  7: "Do painkillers work",
  8: "Times they said “I’m fine”",
  9: "How to run",
  10: "Best thing this week",
  11: "Song on repeat",
  12: "Advice for the next soul",
  13: "Told to run",
};

export function labelFor(stepNumber: number): string {
  return SHORT_LABELS[stepNumber] ?? `Step ${stepNumber}`;
}
