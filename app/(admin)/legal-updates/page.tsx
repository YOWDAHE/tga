import { Suspense } from "react";
import { Skeleton } from "@mantine/core";
import {
  fetchLegalUpdates,
  fetchLegalUpdateSubscribers,
} from "@/app/actionsServers/legal-updates.server.actions";
import LegalUpdatesManagement from "@/components/LegalUpdatesManagement";

interface LegalUpdatesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sortBy?: string;
    order?: string;
    tab?: string;
    subscriberPage?: string;
  }>;
}

export default async function LegalUpdatesPage({ searchParams }: LegalUpdatesPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";
  const sortBy = params.sortBy || "createdAt";
  const order = params.order || "desc";
  const tab = params.tab || "updates";
  const subscriberPage = params.subscriberPage ? parseInt(params.subscriberPage) : 1;

  const [updatesRes, subscribersRes] = await Promise.all([
    fetchLegalUpdates({ page, limit: 10, search: search || undefined, sortBy, order }),
    fetchLegalUpdateSubscribers({ page: subscriberPage, limit: 20 }),
  ]);

  const updates = updatesRes.success ? updatesRes.data : [];
  const pagination = updatesRes.pagination || { currentPage: 1, totalPages: 1 };
  const subscribers = subscribersRes.success ? subscribersRes.data : [];
  const subscriberPagination = subscribersRes.pagination || { currentPage: 1, totalPages: 1 };

  return (
    <Suspense fallback={<Skeleton height={400} />}>
      <LegalUpdatesManagement
        initialUpdates={updates || []}
        initialSubscribers={subscribers || []}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        subscriberPage={subscriberPagination.currentPage}
        subscriberTotalPages={subscriberPagination.totalPages}
        searchQuery={search}
        sortBy={sortBy}
        order={order}
        activeTab={tab}
      />
    </Suspense>
  );
}
