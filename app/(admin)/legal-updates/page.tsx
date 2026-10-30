import {
  fetchLegalUpdates,
  fetchLegalUpdateSubscribers,
} from "@/app/actionsServers/legal-updates.server.actions";
import LegalUpdatesManagement from "@/components/LegalUpdatesManagement";

interface LegalUpdatesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    type?: string;
    sortBy?: string;
    order?: string;
    tab?: string;
  }>;
}

export default async function LegalUpdatesPage({ searchParams }: LegalUpdatesPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";
  const status = params.status === "published" || params.status === "draft" ? params.status : "";
  const type = params.type || "";
  const sortBy = params.sortBy || "createdAt";
  const order = params.order || "desc";
  const tab = params.tab === "subscribers" ? "subscribers" : "updates";

  // The search box and pager serve whichever tab is open
  const [updatesRes, subscribersRes] = await Promise.all([
    fetchLegalUpdates({
      page: tab === "updates" ? page : 1,
      limit: 10,
      search: tab === "updates" ? search || undefined : undefined,
      status: status || undefined,
      content_type: type || undefined,
      sortBy,
      order,
    }),
    fetchLegalUpdateSubscribers({
      page: tab === "subscribers" ? page : 1,
      limit: 20,
      search: tab === "subscribers" ? search || undefined : undefined,
    }),
  ]);

  const pagination = (updatesRes.success && updatesRes.pagination) || { currentPage: 1, totalPages: 1, totalItems: 0 };
  const subscriberPagination = (subscribersRes.success && subscribersRes.pagination) || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  };

  return (
    <LegalUpdatesManagement
      initialUpdates={updatesRes.success ? updatesRes.data || [] : []}
      initialSubscribers={subscribersRes.success ? subscribersRes.data || [] : []}
      error={updatesRes.success ? null : updatesRes.error}
      updatesPage={{ page: pagination.currentPage, totalPages: pagination.totalPages, total: Number(pagination.totalItems ?? 0) }}
      subscribersPage={{
        page: subscriberPagination.currentPage,
        totalPages: subscriberPagination.totalPages,
        total: Number(subscriberPagination.totalItems ?? 0),
      }}
      statusCounts={updatesRes.success ? updatesRes.statusCounts : undefined}
      searchQuery={search}
      status={status}
      type={type}
      sortBy={sortBy}
      order={order}
      activeTab={tab}
    />
  );
}
