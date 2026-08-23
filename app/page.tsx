import Countdown from "@/components/Countdown";
import StartForm from "@/components/StartForm";
import { SITE_CONFIG } from "@/lib/config";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  const who = (name ?? SITE_CONFIG.friendName).slice(0, 80);

  return (
    <main className="screen flex items-center px-5 py-14 sm:px-8">
      <div className="mx-auto w-full max-w-xl">
        <span aria-hidden className="mb-7 block text-5xl">
          🦵
        </span>

        <h1 className="text-balance font-display text-[2.5rem] font-bold leading-[1.08] sm:text-5xl">
          So, {who}. You tried to be an action hero{" "}
          <span className="text-clay-500">and lost.</span>
        </h1>

        <p className="muted mt-5 text-lg leading-relaxed">
          Twenty questions stand between you and your Certificate of Recovery.
        </p>

        <div className="mt-9">
          <StartForm initialName={name ?? ""} />
        </div>

        <div className="mt-10">
          <Countdown />
        </div>
      </div>
    </main>
  );
}
