"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useConfetti } from "./Confetti";
import { certificateSerial, pickDiagnosis, pickPrognosis } from "@/lib/diagnoses";
import { SITE_CONFIG } from "@/lib/config";
import { SPOTLIGHT_STEPS, TOTAL_STEPS, labelFor } from "@/lib/steps";
import { getAnswers, getSessionId, getVisitorName, resetRun } from "@/lib/client";

interface Quote {
  step: number;
  label: string;
  answer: string;
}

const SKIPPED = new Set(["", "(skipped)"]);

export default function Certificate() {
  const burst = useConfetti();
  const cardRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [seed, setSeed] = useState("recovery");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [advice, setAdvice] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [busy, setBusy] = useState<"png" | "share" | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const stored = getAnswers();

    setName(getVisitorName() || stored["1"]?.answer || SITE_CONFIG.friendName);
    setSeed(getSessionId() || "recovery");
    setAdvice(stored[String(TOTAL_STEPS)]?.answer?.trim() ?? "");

    setQuotes(
      SPOTLIGHT_STEPS.filter((n) => n !== TOTAL_STEPS)
        .map((n) => stored[String(n)])
        .filter((a) => a && !SKIPPED.has(a.answer.trim()))
        .slice(0, 3)
        .map((a) => ({ step: a.stepNumber, label: labelFor(a.stepNumber), answer: a.answer }))
    );

    setIssuedOn(
      new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    );

    setReady(true);
    burst("big");
  }, [burst]);

  const diagnosis = useMemo(() => pickDiagnosis(seed), [seed]);
  const prognosis = useMemo(() => pickPrognosis(seed), [seed]);
  const serial = useMemo(() => certificateSerial(seed), [seed]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2600);
  };

  const download = async () => {
    if (!cardRef.current) return;
    setBusy("png");
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `recovery-certificate-${(name || "survivor").toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
    } catch {
      flash("Couldn't render the image — screenshot it instead.");
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy("share");
    const text = `I survived The Recovery Gauntlet. Official diagnosis: ${diagnosis}.`;
    const url = SITE_CONFIG.siteUrl || window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Certificate of Successful Suffering", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        flash("Copied.");
      }
    } catch {
      /* share sheet cancelled */
    } finally {
      setBusy(null);
    }
  };

  if (!ready) return <div className="screen" />;

  return (
    <div className="w-full max-w-xl">
      <div ref={cardRef} className="card animate-pop-in rounded-chunk bg-card p-7 sm:p-10">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-clay-500">
          Certificate of Successful Suffering
        </p>

        <h1 className="mt-5 text-balance text-center font-display text-4xl font-bold leading-tight">
          {name || "A Brave Soul"}
        </h1>

        <p className="muted mt-3 text-center text-sm">
          completed all {TOTAL_STEPS} steps of The Recovery Gauntlet
        </p>

        <div className="mt-8 space-y-3">
          <div className="rounded-2xl bg-clay-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Diagnosis</p>
            <p className="mt-1 font-display text-lg font-bold leading-snug">{diagnosis}</p>
          </div>
          <div className="rounded-2xl bg-tint-sage p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Prognosis</p>
            <p className="mt-1 font-display text-lg font-bold leading-snug">{prognosis}</p>
          </div>
        </div>

        {advice && !SKIPPED.has(advice) && (
          <blockquote className="mt-8 border-l-2 border-clay-300 pl-5">
            <p className="text-balance text-lg italic leading-snug">&ldquo;{advice}&rdquo;</p>
          </blockquote>
        )}

        {quotes.length > 0 && (
          <ul className="mt-8 space-y-2.5 border-t border-line pt-6">
            {quotes.map((q) => (
              <li key={q.step} className="text-sm leading-relaxed">
                <span className="muted">{q.label}</span>
                <br />
                <span className="font-medium">{q.answer}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="muted mt-8 border-t border-line pt-4 text-center text-xs tabular-nums">
          {issuedOn} · {serial}
        </p>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={download} disabled={busy !== null} className="btn-primary">
          {busy === "png" ? "Rendering" : "Download"}
        </button>
        <button type="button" onClick={share} disabled={busy !== null} className="btn-quiet">
          Share
        </button>
        <button
          type="button"
          onClick={() => {
            resetRun();
            window.location.href = "/";
          }}
          className="btn-quiet"
        >
          Start over
        </button>
      </div>

      {toast && (
        <p className="mt-4 text-center text-sm font-medium text-clay-600" role="status">
          {toast}
        </p>
      )}
    </div>
  );
}
