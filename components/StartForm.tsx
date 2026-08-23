"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getVisitorName, setVisitorName, answeredCount, resetRun } from "@/lib/client";

interface Props {
  /** Name from ?name= — pre-fills the field. */
  initialName?: string;
}

export default function StartForm({ initialName = "" }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [inProgress, setInProgress] = useState(0);

  useEffect(() => {
    if (!initialName) {
      const saved = getVisitorName();
      if (saved) setName(saved);
    }
    setInProgress(answeredCount());
  }, [initialName]);

  const start = () => {
    const clean = name.trim().slice(0, 80);
    if (clean) setVisitorName(clean);
    router.push(clean ? `/gauntlet?name=${encodeURIComponent(clean)}` : "/gauntlet");
  };

  const startOver = () => {
    resetRun();
    setInProgress(0);
    router.push("/gauntlet");
  };

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && start()}
          placeholder="Your name, patient zero"
          aria-label="Your name"
          maxLength={80}
          className="field sm:flex-1"
        />
        <button type="button" onClick={start} className="btn-primary shrink-0">
          Start the Gauntlet <span aria-hidden>→</span>
        </button>
      </div>

      {inProgress > 0 && (
        <p className="muted text-sm">
          You&apos;re {inProgress}/20 in already.{" "}
          <button type="button" onClick={start} className="font-semibold text-accent-600 underline">
            Pick up where you left off
          </button>{" "}
          or{" "}
          <button
            type="button"
            onClick={startOver}
            className="font-semibold text-accent-600 underline"
          >
            start over
          </button>
          .
        </p>
      )}
    </div>
  );
}
