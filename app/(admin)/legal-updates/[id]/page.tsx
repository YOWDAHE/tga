import { Suspense } from "react";
import { Skeleton } from "@mantine/core";
import { fetchLegalUpdateById } from "@/app/actionsServers/legal-updates.server.actions";
import { notFound } from "next/navigation";
import LegalUpdateDetails from "@/components/LegalUpdateDetails";

interface LegalUpdateDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LegalUpdateDetailPage({ params }: LegalUpdateDetailPageProps) {
  const { id } = await params;
  const res = await fetchLegalUpdateById(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <Suspense fallback={<Skeleton height={400} />}>
      <LegalUpdateDetails legalUpdate={res.data} />
    </Suspense>
  );
}
