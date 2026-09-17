import { Suspense } from "react";
import { Skeleton } from "@mantine/core";
import { fetchLegalUpdateById } from "@/app/actionsServers/legal-updates.server.actions";
import { getCategories } from "@/app/actionsServers/archive.server.actions";
import LegalUpdatesForm from "@/components/LegalUpdatesForm";

interface LegalUpdatesAddPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function LegalUpdatesAddPage({ searchParams }: LegalUpdatesAddPageProps) {
  const editId = (await searchParams).edit;
  let legalUpdateToEdit = null;
  let categories: Array<{ value: string; label: string }> = [];

  try {
    const categoriesRes = await getCategories();
    if (categoriesRes.success) {
      categories = categoriesRes.data || [];
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  if (editId) {
    try {
      const res = await fetchLegalUpdateById(editId);
      if (res.success) {
        legalUpdateToEdit = res.data;
      }
    } catch (error) {
      console.error("Error fetching legal update for edit:", error);
    }
  }

  return (
    <Suspense fallback={<Skeleton height={400} />}>
      <LegalUpdatesForm legalUpdateToEdit={legalUpdateToEdit} categories={categories} />
    </Suspense>
  );
}
