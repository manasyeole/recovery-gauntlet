"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ProgressBar from "./ProgressBar";
import StepCard from "./StepCard";
import { useConfetti } from "./Confetti";
import { STEPS, TOTAL_STEPS, getStep } from "@/lib/steps";
import {
  getAnswers,
  getLastStep,
  getVisitorName,
  saveAnswer,
  setLastStep,
  setVisitorName,
} from "@/lib/client";

/** Extra confetti at the quarter marks, on top of per-step `confetti` flags. */
const MILESTONES = new Set([5, 10, 15]);

const SWIPE_THRESHOLD = 60; // px

export default function GauntletWizard({ initialName = "" }: { initialName?: string }) {
  const router = useRouter();
  const burst = useConfetti();

  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [shake, setShake] = useState(false);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  /* -------------------------- restore progress -------------------------- */

  useEffect(() => {
    const stored = getAnswers();
    const restored: Record<number, string> = {};
    for (const key of Object.keys(stored)) restored[Number(key)] = stored[key].answer;

    if (initialName) {
      setVisitorName(initialName);
      restored[1] = restored[1] || initialName;
    }

    setValues(restored);
    setStep(getLastStep());
    setHydrated(true);
  }, [initialName]);

  useEffect(() => {
    if (hydrated) setLastStep(step);
  }, [step, hydrated]);

  const current = getStep(step) ?? STEPS[0];
  const value = values[step] ?? "";

  const setValue = useCallback(
    (v: string) => setValues((prev) => ({ ...prev, [step]: v })),
    [step]
  );

  /* ------------------------------ advance ------------------------------- */

  const goNext = useCallback(async () => {
    const answer = (values[step] ?? "").trim();

    if (current.required && !answer) {
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }

    const isLast = step >= TOTAL_STEPS;
    setSaving(true);

    // Step 1 doubles as the name field.
    const name = step === 1 && answer ? answer : getVisitorName();
    if (step === 1 && answer) setVisitorName(answer);

    await saveAnswer(step, current.question, answer || "(skipped)", {
      completed: isLast,
      visitorName: name || undefined,
    });

    setSaving(false);

    if (current.confetti) burst(isLast ? "big" : "small");
    else if (MILESTONES.has(step)) burst("small");

    if (isLast) {
      router.push("/results");
      return;
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [burst, current, router, step, values]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* --------------------------- keyboard nav ----------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

      if (e.key === "ArrowLeft" && !typing && step > 1) {
        e.preventDefault();
        goBack();
      }
      if (e.key === "ArrowRight" && !typing) {
        e.preventDefault();
        void goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack, goNext, step]);

  /* ----------------------------- swipe nav ------------------------------ */

  const onTouchStart = (e: React.TouchEvent) => {
    // Don't treat a slider drag or text selection as a page swipe.
    const el = e.target as HTMLElement;
    if (el.closest('input[type="range"], textarea, input[type="text"]')) {
      touchStart.current = null;
      return;
    }
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    if (dx < 0) void goNext();
    else if (step > 1) goBack();
  };

  /* ------------------------------- render -------------------------------- */

  if (!hydrated) {
    return <div className="screen" />;
  }

  return (
    <main
      className="screen px-4 py-8 sm:px-6 sm:py-12"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-7">
          <ProgressBar current={step} />
        </div>

        <div className={shake ? "animate-nudge" : undefined}>
          <StepCard
            step={current}
            value={value}
            onChange={setValue}
            onSubmit={() => void goNext()}
            onBack={goBack}
            canGoBack={step > 1}
            isLast={step >= TOTAL_STEPS}
            saving={saving}
          />
        </div>
      </div>
    </main>
  );
}
