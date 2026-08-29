import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RoomClient from "@/components/games/RoomClient";
import { cleanCode, CODE_LENGTH } from "@/lib/games/protocol";

export const metadata: Metadata = {
  title: "Games room",
  robots: { index: false, follow: false },
};

/**
 * A room, as reached by a shared link or a typed code.
 *
 * The shell is a server component so a mistyped code 404s without shipping
 * any JavaScript; everything live happens inside RoomClient.
 */
export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const raw = (await params).code ?? "";
  const code = cleanCode(raw);
  // Case is forgiven (links get typed out and lowercased); anything else in
  // the URL means this was never a room code, so 404 rather than render a
  // room screen for some truncated version of what they typed.
  if (code.length !== CODE_LENGTH || code !== raw.toUpperCase()) notFound();

  return (
    <main className="screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/games" className="muted text-sm underline underline-offset-4 hover:text-ink">
            Leave
          </Link>
          <span className="text-xs font-semibold tracking-[0.2em] text-ink-soft">{code}</span>
        </header>

        <RoomClient code={code} />
      </div>
    </main>
  );
}
