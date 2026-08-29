"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cleanCode, CODE_LENGTH } from "@/lib/games/protocol";

/**
 * The code box. Deliberately does not ask for a name — the room screen does
 * that, so a pasted link and a typed code land in exactly the same place.
 */
export default function JoinCodeForm({ autoFocus }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const ready = code.length === CODE_LENGTH;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) router.push(`/games/room/${code}`);
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <label className="flex-1">
        <span className="sr-only">Room code</span>
        <input
          value={code}
          onChange={(e) => setCode(cleanCode(e.target.value))}
          placeholder="ABC123"
          autoFocus={autoFocus}
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={CODE_LENGTH}
          className="field text-center font-display text-2xl font-bold uppercase tracking-[0.35em]
            placeholder:tracking-[0.35em]"
        />
      </label>
      <button type="submit" disabled={!ready} className="btn-primary sm:px-8">
        Join
      </button>
    </form>
  );
}
