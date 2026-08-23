"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  const [completed, setCompleted] = useState(0);
  const [issuedOn, setIssuedOn] = useState("");
  const [busy, setBusy] = useState<"png" | "share" | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const stored = getAnswers();
    const entries = Object.values(stored);

    setName(getVisitorName() || stored["1"]?.answer || SITE_CONFIG.friendName);
    setSeed(getSessionId() || "recovery");
    setCompleted(entries.filter((a) => !SKIPPED.has(a.answer.trim())).length);
    setAdvice(stored[String(TOTAL_STEPS)]?.answer?.trim() ?? "");

    const picked = SPOTLIGHT_STEPS.filter((n) => n !== TOTAL_STEPS)
      .map((n) => stored[String(n)])
      .filter((a) => a && !SKIPPED.has(a.answer.trim()))
      .slice(0, 4)
      .map((a) => ({ step: a.stepNumber, label: labelFor(a.stepNumber), answer: a.answer }));
    setQuotes(picked);

    setIssuedOn(
      new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
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
        backgroundColor: getComputedStyle(document.body).backgroundColor || "#fffaf5",
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `recovery-certificate-${(name || "survivor").toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      flash("Saved. Post it in the group chat.");
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
        flash("Copied to clipboard.");
      }
    } catch {
      /* the visitor cancelled the share sheet */
    } finally {
      setBusy(null);
    }
  };

  if (!ready) {
    return <p className="muted animate-pulse text-sm">Notarising your suffering…</p>;
  }

  return (
    <div className="w-full max-w-2xl">
      {/* ---------------------------- certificate ---------------------------- */}
      <div
        ref={cardRef}
        className="card animate-pop-in rounded-chunk p-6 shadow-chunk sm:p-9 dark:shadow-chunk-dark"
      >
        <div
          className="rounded-[1.25rem] border-2 border-dashed p-5 sm:p-8"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-accent-600">
            Certificate of Successful Suffering
          </p>

          <h1 className="mt-4 text-balance text-center font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            {name || "A Brave Soul"}
          </h1>

          <p className="muted mt-3 text-center text-sm leading-relaxed">
            has completed all {TOTAL_STEPS} steps of The Recovery Gauntlet with{" "}
            <strong className="text-accent-600">{completed}</strong> genuine answers and a
            distressing amount of enthusiasm.
          </p>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl p-4" style={{ background: "var(--page-2)" }}>
              <dt className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Official diagnosis
              </dt>
              <dd className="mt-1 font-display text-base font-bold leading-snug">{diagnosis}</dd>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "var(--page-2)" }}>
              <dt className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Prognosis
              </dt>
              <dd className="mt-1 font-display text-base font-bold leading-snug">{prognosis}</dd>
            </div>
          </dl>

          {advice && !SKIPPED.has(advice) && (
            <blockquote className="mt-6 border-l-4 border-accent-400 pl-4">
              <p className="text-balance text-lg font-medium italic leading-snug">
                &ldquo;{advice}&rdquo;
              </p>
              <footer className="muted mt-1.5 text-xs">
                — advice to the next unlucky soul
              </footer>
            </blockquote>
          )}

          {quotes.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Entered into the permanent record
              </p>
              <ul className="mt-2.5 space-y-2">
                {quotes.map((q) => (
                  <li key={q.step} className="text-sm leading-relaxed">
                    <span className="muted">{q.label}:</span>{" "}
                    <span className="font-medium">{q.answer}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            className="mt-7 flex flex-wrap items-end justify-between gap-3 border-t pt-4 text-xs"
            style={{ borderColor: "var(--line)" }}
          >
            <div>
              <p className="muted">Issued {issuedOn}</p>
              <p className="muted">Serial {serial}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-base font-bold italic">The Gauntlet</p>
              <p className="muted">Chief Medical Officer of Nonsense</p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------ actions ------------------------------ */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={download} disabled={busy !== null} className="btn-primary">
          {busy === "png" ? "Rendering…" : "⬇️ Download as image"}
        </button>
        <button type="button" onClick={share} disabled={busy !== null} className="btn-ghost card">
          {busy === "share" ? "Sharing…" : "🔗 Share"}
        </button>
        <Link href="/gauntlet" className="btn-ghost muted">
          Review my answers
        </Link>
        <button
          type="button"
          onClick={() => {
            resetRun();
            window.location.href = "/";
          }}
          className="btn-ghost muted"
        >
          Start fresh
        </button>
      </div>

      {toast && (
        <p className="mt-4 text-center text-sm font-medium text-accent-600" role="status">
          {toast}
        </p>
      )}

      <p className="muted mt-8 text-center text-xs leading-relaxed">
        Your answers are saved. They will be read aloud at the next available opportunity.
      </p>
    </div>
  );
}
