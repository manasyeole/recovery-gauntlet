import Certificate from "@/components/Certificate";
import SongLines from "@/components/SongLines";
import { CERTIFICATE_SONG } from "@/lib/steps";

export const metadata = { title: "Certificate of Successful Suffering" };

export default function ResultsPage() {
  return (
    <main className="screen relative flex flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <SongLines lines={CERTIFICATE_SONG} tint="bg-tint-butter" />

      <div className="relative z-10 flex w-full flex-col items-center">
        <Certificate />
      </div>
    </main>
  );
}
