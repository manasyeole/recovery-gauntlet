import Link from "next/link";
import Countdown from "@/components/Countdown";
import StartForm from "@/components/StartForm";
import { SITE_CONFIG } from "@/lib/config";
import { TOTAL_STEPS } from "@/lib/steps";

const FEATURES = [
  { emoji: "🎭", title: "Roasts", body: "Gentle, medically-approved slander." },
  { emoji: "🤸", title: "Stupid activities", body: "You will be asked to prove things." },
  { emoji: "🎓", title: "A certificate", body: "Legally meaningless. Emotionally binding." },
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  const who = (name ?? SITE_CONFIG.friendName).slice(0, 80);

  return (
    <main className="screen flex flex-col items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="card inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider">
            <span aria-hidden>🦵</span> {SITE_CONFIG.copy.title}
          </span>
          <Countdown />
        </div>

        <h1 className="text-balance font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">
          So,{" "}
          <span className="relative inline-block">
            <span className="relative z-10">{who}</span>
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 bg-accent-300/60 sm:h-4"
            />
          </span>
          . You tried to be an action hero{" "}
          <span className="text-accent-600">and lost.</span>
        </h1>

        <p className="muted mt-5 max-w-xl text-lg leading-relaxed sm:text-xl">
          {SITE_CONFIG.copy.subhead} Anyway — {SITE_CONFIG.copy.tagline.toLowerCase()} Answers are
          recorded. Yes, really.
        </p>

        <div className="mt-8">
          <StartForm initialName={name ?? ""} />
        </div>

        <dl className="mt-12 grid gap-3 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card rounded-chunk p-5">
              <dt className="font-display text-base font-bold">
                <span aria-hidden className="mr-2 text-xl">
                  {f.emoji}
                </span>
                {f.title}
              </dt>
              <dd className="muted mt-1.5 text-sm leading-relaxed">{f.body}</dd>
            </div>
          ))}
        </dl>

        <footer className="muted mt-12 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span>
            {TOTAL_STEPS} steps · roughly 4 minutes · no medical value whatsoever
          </span>
          <Link href="/results" className="underline hover:text-accent-600">
            Already finished? See your certificate
          </Link>
        </footer>
      </div>
    </main>
  );
}
