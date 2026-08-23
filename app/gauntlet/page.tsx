import GauntletWizard from "@/components/GauntletWizard";

export const metadata = { title: "The Gauntlet — 20 steps" };

export default async function GauntletPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  return <GauntletWizard initialName={(name ?? "").slice(0, 80)} />;
}
