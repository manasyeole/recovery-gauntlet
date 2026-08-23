"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { answeredCount, getVisitorName, resetRun, setVisitorName } from "@/lib/client";
import { TOTAL_STEPS } from "@/lib/steps";

export default function StartForm({ initialName = "" }: { initialName?: string }) {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && start()}
          placeholder="Your name"
          aria-label="Your name"
          maxLength={80}
          className="field sm:flex-1"
        />
        <button type="button" onClick={start} className="btn-primary shrink-0">
          Begin
        </button>
      </div>

      {inProgress > 0 && (
        <p className="muted text-sm">
          {inProgress} of {TOTAL_STEPS} answered.{" "}
          <button
            type="button"
            onClick={() => {
              resetRun();
              setInProgress(0);
              router.push("/gauntlet");
            }}
            className="font-semibold text-clay-600 underline"
          >
            Start over
          </button>
        </p>
      )}
    </div>
  );
}
