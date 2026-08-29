"use client";

import { AVATARS, MAX_NAME } from "@/lib/games/protocol";

/**
 * Name and face. This is the entire sign-up: no email, no password, nothing
 * that outlives the room. Shared by the create screen and the join screen so
 * the two feel like the same act.
 */
export default function IdentityFields({
  name,
  emoji,
  onName,
  onEmoji,
  autoFocus,
}: {
  name: string;
  emoji: string;
  onName: (v: string) => void;
  onEmoji: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold">What should we call you?</span>
        <input
          className="field"
          value={name}
          onChange={(e) => onName(e.target.value)}
          maxLength={MAX_NAME}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          placeholder="Your name"
        />
      </label>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-semibold">Pick a face</legend>
        <div className="grid grid-cols-8 gap-1.5">
          {AVATARS.map((a) => {
            const selected = a === emoji;
            return (
              <button
                key={a}
                type="button"
                onClick={() => onEmoji(a)}
                aria-pressed={selected}
                aria-label={`Avatar ${a}`}
                className={`grid aspect-square place-items-center rounded-xl border text-xl transition
                  active:scale-95 ${
                    selected
                      ? "border-clay-500 bg-clay-50"
                      : "border-line bg-card hover:border-clay-300 hover:bg-clay-50"
                  }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}
