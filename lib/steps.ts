/**
 * THE 20 STEPS
 * ============
 * This array is the whole gauntlet. Edit the copy freely — the wizard,
 * progress bar, API and certificate all read from here.
 *
 * Six steps are marked `yourTurn: true` (5, 10, 14, 17, 19). They ship with
 * generic filler that *works*, but the site is 10x funnier once you replace
 * them with real inside jokes. Search this file for "[YOUR TURN]".
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
      "So. You tried to be an action hero and lost. Welcome to The Gauntlet — 20 steps stand between you and your Certificate of Recovery. Type your name to begin.",
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
      "Say 'ouch' out loud right now, as dramatically as possible. Tap below once you've done it. We will know if you're lying.",
    hint: "If someone else is in the room, even better.",
    cta: "I did it (I'm not lying)",
    confetti: true,
  },

  // ============================= [YOUR TURN] =============================
  // Step 5 — reference how the injury ACTUALLY happened, if it's a good
  // story. Swap the question + options below for the real version.
  // =======================================================================
  {
    number: 5,
    kind: "tease",
    type: "choice",
    emoji: "🎬",
    question:
      "Let's set the record straight. Which version of the story are we going with publicly?",
    hint: "[YOUR TURN] Replace these options with the real story vs. the version they tell people.",
    options: [
      "The heroic version I've been telling everyone",
      "The deeply embarrassing true version",
      "A tragic accident, no further questions",
      "I genuinely still don't know what happened",
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

  // ============================= [YOUR TURN] =============================
  // Step 10 — an inside joke about their clumsiness, how you found out, or
  // their reaction. Good slot for "remember when you also did X".
  // =======================================================================
  {
    number: 10,
    kind: "tease",
    type: "longtext",
    emoji: "📞",
    question:
      "Walk me through the exact moment you had to tell people what happened. Word for word.",
    hint: "[YOUR TURN] Swap in your own bit — the group-chat message, the phone call, the excuse.",
    placeholder: "It started with me saying 'okay so don't panic'…",
    spotlight: true,
    yourTurn: true,
  },

  {
    number: 11,
    kind: "activity",
    type: "hold",
    emoji: "🤫",
    question:
      "Hold perfectly still and silent for 5 seconds to 'prove' you're resting. Press and hold the button the whole time.",
    hint: "Let go early and we start over. Rules are rules.",
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

  // ============================= [YOUR TURN] =============================
  // Step 14 — the shared plan / trip / match / party this injury is now
  // ruining. Prime good-natured guilt-tripping territory.
  // =======================================================================
  {
    number: 14,
    kind: "tease",
    type: "choice",
    emoji: "🗓️",
    question:
      "Quick reminder that you have personally sabotaged plans we had. How do you plead?",
    hint: "[YOUR TURN] Name the actual trip/game/event here and make the options specific.",
    options: [
      "Guilty. I will compensate you in food.",
      "Not guilty — we can still go, I'll just be slow",
      "I'd like to reschedule to a vague future date",
      "I refuse to acknowledge this question",
    ],
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

  // ============================= [YOUR TURN] =============================
  // Step 17 — the running bit / nickname specific to this friend.
  // =======================================================================
  {
    number: 17,
    kind: "tease",
    type: "text",
    emoji: "🏷️",
    question:
      "Given recent events, propose your new official nickname. It will be adopted immediately and permanently.",
    hint: "[YOUR TURN] Put the actual running bit or existing nickname in here.",
    placeholder: "Make it dignified. You won't.",
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

  // ============================= [YOUR TURN] =============================
  // Step 19 — closing tease. Something only this friend group would get.
  // =======================================================================
  {
    number: 19,
    kind: "tease",
    type: "longtext",
    emoji: "😈",
    question:
      "Final accusation before we let you go. Anything you'd like to admit to the group now, while you can't run away?",
    hint: "[YOUR TURN] This is the slot for the joke only your people would understand.",
    placeholder: "Fine. Yes. It was me.",
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
  5: "Official story",
  6: "Bed-rot level",
  7: "Emergency mobility aid",
  8: "Runway commentary",
  9: "Pillow count",
  10: "How they broke the news",
  11: "Proof of resting",
  12: "What the leg is yelling",
  13: "Most ridiculous fetch request",
  14: "Plans sabotaged — plea",
  15: "Single-leg victory pose",
  16: "Recovery TV rating",
  17: "New nickname",
  18: "Googled symptoms 5+ times",
  19: "Final confession",
  20: "Advice for the next idiot",
};

export function labelFor(stepNumber: number): string {
  return SHORT_LABELS[stepNumber] ?? `Step ${stepNumber}`;
}
