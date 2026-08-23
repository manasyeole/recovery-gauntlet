import Link from "next/link";
import Countdown from "@/components/Countdown";
import SongLines from "@/components/SongLines";
import { LANDING_SONG } from "@/lib/steps";

export default function LandingPage() {
  return (
    <main className="screen relative flex items-center overflow-hidden px-5 py-14 sm:px-8">
      <SongLines lines={LANDING_SONG} />

      <div className="relative z-10 mx-auto w-full max-w-xl text-center">
        <span aria-hidden className="mb-8 block text-5xl">
          🦵
        </span>

        <h1 className="text-balance font-display text-[2.5rem] font-bold leading-[1.08] sm:text-5xl">
          END is the{" "}
          <Link
            href="/gauntlet"
            className="tap inline-flex rounded-2xl px-1 text-clay-500 underline decoration-clay-300 decoration-[3px] underline-offset-[6px] transition hover:text-clay-600 hover:decoration-clay-500 active:scale-[0.98]"
          >
            beginning
          </Link>
        </h1>

        <p className="muted mt-8 text-sm">Tap the word. That is the whole instruction.</p>

        <div className="mt-10">
          <Countdown />
        </div>
      </div>
    </main>
  );
}
