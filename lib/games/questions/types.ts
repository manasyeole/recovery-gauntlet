/**
 * One question, four choices, one right answer.
 *
 * `id` has to be stable forever: a room stores the ids it drew at creation
 * time, so renumbering a bank would repoint a game already in progress at the
 * wrong questions. Append new questions, never renumber old ones.
 */
export interface Question {
  /** Unique within its bank. Prefixed with the game slug when stored. */
  id: string;
  prompt: string;
  choices: readonly [string, string, string, string];
  /** Index into `choices`. */
  answer: 0 | 1 | 2 | 3;
  /** Shown on the reveal screen. Keep it to one sentence. */
  fact?: string;
}
