import FinishLine from "@/components/FinishLine";
import SongLines from "@/components/SongLines";
import { FINISH_SONG } from "@/lib/steps";

export const metadata = { title: "The world is still running" };

export default function ResultsPage() {
  return (
    <main className="screen relative flex flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <SongLines lines={FINISH_SONG} tint="bg-tint-butter" />

      <div className="relative z-10 flex w-full flex-col items-center">
        <FinishLine />
      </div>
    </main>
  );
}
