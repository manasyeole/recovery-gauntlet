import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import CreateRoomForm from "@/components/games/CreateRoomForm";

export const metadata: Metadata = {
  title: "Open a room",
  robots: { index: false, follow: false },
};

/**
 * The create screen. `CreateRoomForm` reads ?game= via useSearchParams, which
 * Next requires to sit under a Suspense boundary so the rest of the page can
 * still be prerendered.
 */
export default function CreateRoomPage() {
  return (
    <main className="screen px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-8">
          <Link href="/games" className="muted text-sm underline underline-offset-4 hover:text-ink">
            All games
          </Link>
          <h1 className="mt-3 font-display text-3xl font-bold">Open a room</h1>
        </header>

        <Suspense
          fallback={<div className="card h-64 animate-pulse rounded-chunk" aria-hidden />}
        >
          <CreateRoomForm />
        </Suspense>
      </div>
    </main>
  );
}
