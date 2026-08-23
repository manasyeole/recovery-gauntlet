import Certificate from "@/components/Certificate";

export const metadata = { title: "Certificate of Successful Suffering" };

export default function ResultsPage() {
  return (
    <main className="screen flex flex-col items-center justify-center px-4 py-10 sm:px-6">
      <Certificate />
    </main>
  );
}
