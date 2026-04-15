import VerifyClient from "@/components/VerifyClient";

interface VerifyPageProps {
  searchParams: Promise<{ roundId?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  return <VerifyClient initialRoundId={params.roundId ?? ""} />;
}
