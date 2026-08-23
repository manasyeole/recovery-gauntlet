/**
 * THE 20 STEPS
 * ============
 * This array is the whole gauntlet. Edit the copy freely — the wizard,
 * progress bar, API and certificate all read from here.
 *
 * Five steps are marked `yourTurn: true` (5, 10, 14, 17, 19). These are the
 * personalisation slots — they're fully written and land fine as-is, but they
 * get sharper with a real inside joke. Search for "PERSONALISE ME".
 *
 * NOTE: `hint` renders on screen, under the question. Author notes belong in
 * comments, never in `hint` — a stray note there is visible to the visitor.
 *
 * `spotlight: true` marks answers worth quoting on the certificate screen.
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
}

export const STEPS: Step[] = [
  {
    number: 1,
    kind: "greeting",
    type: "text",
    emoji: "🦵",
    question:
      "First things first — what should we call you?",
    hint: "Real name preferred. Nicknames will be used against you later.",
    placeholder: "Your name, survivor",
    required: true,
  },
  {
    number: 2,
    kind: "tease",
    type: "slider",
    emoji: "🎭",
    question:
      "On a scale of 'stubbed my toe' to 'reenacting a war movie,' how dramatic were you when it happened?",
    min: 1,
    max: 10,
    minLabel: "Stubbed my toe",
    maxLabel: "Reenacting a war movie",
    required: true,
  },
  {
    number: 3,
    kind: "question",
    type: "number",
    emoji: "🚶",
    question:
      "Be honest: how many times have you already tried to walk normally today and regretted it?",
    hint: "Zero is a lie and we both know it.",
    placeholder: "0",
    min: 0,
    max: 999,
    required: true,
  },
  {
    number: 4,
    kind: "activity",
    type: "confirm",
    emoji: "😩",
    question:
      "Say 'ouch' out loud right now, as dramatically as possible. We will know if you're lying.",
    hint: "If someone else is in the room, even better.",
    cta: "I did it (I'm not lying)",
    confetti: true,
  },

  // --- PERSONALISE ME (step 5) -------------------------------------------
  // Works as-is for any leg injury. If the real story is good, replace the
  // options with it — keep one deliberately absurd option in the list.
  // -----------------------------------------------------------------------
  {
    number: 5,
    kind: "tease",
    type: "choice",
    emoji: "🎬",
    question:
      "Official Incident Report. For the permanent record: what actually took you down?",
    hint: "Choose carefully. This is the version history will remember.",
    options: [
      "Sports. I was being athletic and the universe objected.",
      "Stairs. Not even a lot of them.",
      "A vehicle was involved and I'd rather not elaborate.",
      "I was rushing somewhere that would have waited for me.",
      "Genuinely nothing. My leg resigned without notice.",
      "I know exactly what happened and I will never tell you.",
    ],
    spotlight: true,
    yourTurn: true,
    required: true,
  },

  {
    number: 6,
    kind: "question",
    type: "choice",
    emoji: "🛏️",
    question:
      "Rate your current bed-rot level from 'productive hermit' to 'human blanket burrito.'",
    options: [
      "Productive hermit — laptop, schedule, dignity",
      "Mildly horizontal but functional",
      "Structurally part of the mattress now",
      "Human blanket burrito. Do not disturb.",
    ],
    required: true,
  },
  {
    number: 7,
    kind: "tease",
    type: "choice",
    emoji: "🧹",
    question: "Pick the item you have used as an emergency mobility aid:",
    options: [
      "A broom",
      "A chair on wheels",
      "A very judgmental cat",
      "A family member I bossed around",
      "All of the above, in one afternoon",
    ],
    spotlight: true,
    required: true,
  },
  {
    number: 8,
    kind: "activity",
    type: "text",
    emoji: "💃",
    question:
      "Do your best 'crutches strut' in your head and describe it in one sentence like a runway commentator.",
    hint: "Commit to the bit. Use the voice.",
    placeholder: "And here comes the look…",
    spotlight: true,
    confetti: true,
  },
  {
    number: 9,
    kind: "question",
    type: "number",
    emoji: "🛋️",
    question:
      "How many pillows are currently propping up your leg? Answer honestly, we both know it's excessive.",
    placeholder: "Count them. Now.",
    min: 0,
    max: 99,
    required: true,
  },

  // --- PERSONALISE ME (step 10) ------------------------------------------
  // Swap in the actual message they sent you, if you still have it. Quoting
  // it back at them lands harder than asking.
  // -----------------------------------------------------------------------
  {
    number: 10,
    kind: "tease",
    type: "longtext",
    emoji: "📞",
    question:
      "Reconstruct the message you sent when you broke the news — including the part where you undersold it.",
    hint: "We've all read that message. We just want it in writing, from you.",
    placeholder: "hey so minor thing, don't freak out…",
    spotlight: true,
    yourTurn: true,
  },

  {
    number: 11,
    kind: "activity",
    type: "hold",
    emoji: "🤫",
    question:
      "Hold perfectly still and silent for 5 seconds to 'prove' you're resting.",
    cta: "Hold to rest",
    holdSeconds: 5,
    confetti: true,
  },
  {
    number: 12,
    kind: "tease",
    type: "text",
    emoji: "🗣️",
    question: "If your injured leg could talk right now, what would it be yelling at you?",
    placeholder: "Direct quote, please",
    spotlight: true,
  },
  {
    number: 13,
    kind: "question",
    type: "text",
    emoji: "🙏",
    question:
      "What's the most ridiculous thing you've asked someone to fetch for you since this happened?",
    placeholder: "Be specific. Names optional.",
    spotlight: true,
  },

  // --- PERSONALISE ME (step 14) ------------------------------------------
  // Name the actual trip/match/wedding for maximum guilt. The generic
  // categories below still work if there isn't one.
  // -----------------------------------------------------------------------
  {
    number: 14,
    kind: "tease",
    type: "choice",
    emoji: "🗓️",
    question:
      "Let the record show you have personally cancelled things. Which category of plan did you destroy?",
    hint: "Sentencing will be handled by the group chat.",
    options: [
      "A trip. Deposits were paid. People are upset.",
      "A match I was, allegedly, essential to.",
      "An event I now get to attend seated.",
      "Nothing — I've just made everything 40% slower.",
      "I have cancelled nothing. I will be attending. Horizontally if needed.",
    ],
    spotlight: true,
    yourTurn: true,
    required: true,
  },

  {
    number: 15,
    kind: "activity",
    type: "choice",
    emoji: "🏆",
    question: "Attempt one (1) single-leg victory pose. Rate how it went.",
    hint: "Please do not actually injure yourself. Again.",
    options: [
      "Graceful. Olympic, even.",
      "Wobbly, but survived",
      "Grabbed furniture halfway through",
      "New injury acquired",
      "I declined on medical grounds",
    ],
    spotlight: true,
    confetti: true,
    required: true,
  },
  {
    number: 16,
    kind: "question",
    type: "slider",
    emoji: "📺",
    question:
      "Pain levels aside — rate your Netflix-and-recovery-content quality this week out of 10.",
    min: 1,
    max: 10,
    minLabel: "Rewatching ads",
    maxLabel: "Genuinely peak television",
    required: true,
  },

  // --- PERSONALISE ME (step 17) ------------------------------------------
  // If they already have a nickname, work it into the question so they have
  // to defend it.
  // -----------------------------------------------------------------------
  {
    number: 17,
    kind: "tease",
    type: "text",
    emoji: "🏷️",
    question:
      "Propose your new legal name. It must reference the injury. It will be used in group chats, at formal occasions, and eventually in your eulogy.",
    hint: "Whatever you type here is binding. Choose accordingly.",
    placeholder: "Set the bar higher than 'One-Leg Larry'",
    spotlight: true,
    yourTurn: true,
  },

  {
    number: 18,
    kind: "tease",
    type: "yesno",
    emoji: "🔍",
    question:
      "Confess: have you Googled your own symptoms/recovery timeline more than 5 times today?",
    hint: "Search history is admissible evidence.",
    required: true,
  },

  // --- PERSONALISE ME (step 19) ------------------------------------------
  // Best slot for the joke only your group would get. Point the question at
  // one specific unresolved crime.
  // -----------------------------------------------------------------------
  {
    number: 19,
    kind: "tease",
    type: "longtext",
    emoji: "😈",
    question:
      "Last chance. You are immobile, cornered, and legally obliged to answer: what have you been getting away with that we should know about?",
    hint: "You physically cannot run away from this question. That was the whole plan.",
    placeholder: "Fine. Okay. So.",
    spotlight: true,
    yourTurn: true,
  },

  {
    number: 20,
    kind: "closing",
    type: "longtext",
    emoji: "🎓",
    question:
      "Congratulations, survivor. You've completed The Gauntlet. Type one sentence of advice for the next unlucky soul who breaks a leg.",
    hint: "This goes on your certificate. Choose wisely.",
    placeholder: "My advice to the next idiot:",
    spotlight: true,
    confetti: true,
    required: true,
  },
];

export const TOTAL_STEPS = STEPS.length;

export function getStep(n: number): Step | undefined {
  return STEPS.find((s) => s.number === n);
}

/** Steps whose answers are quoted on the certificate. */
export const SPOTLIGHT_STEPS = STEPS.filter((s) => s.spotlight).map((s) => s.number);

/** Short labels for the admin table and certificate, so long questions don't wreck layout. */
export const SHORT_LABELS: Record<number, string> = {
  1: "Name",
  2: "Drama level",
  3: "Failed normal walks",
  4: "Said 'ouch'",
  5: "Cause of downfall",
  6: "Bed-rot level",
  7: "Emergency mobility aid",
  8: "Runway commentary",
  9: "Pillow count",
  10: "How they broke the news",
  11: "Proof of resting",
  12: "What the leg is yelling",
  13: "Most ridiculous fetch request",
  14: "Plans destroyed",
  15: "Single-leg victory pose",
  16: "Recovery TV rating",
  17: "New legal name",
  18: "Googled symptoms 5+ times",
  19: "Final confession",
  20: "Advice for the next idiot",
};

export function labelFor(stepNumber: number): string {
  return SHORT_LABELS[stepNumber] ?? `Step ${stepNumber}`;
}
