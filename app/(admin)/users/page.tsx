"use server";
import UsersManagement from "@/components/UsersManagement";
import { fetchUsers } from "@/app/actionsServers/user.server.action";
import { fetchAuditLogs } from "@/app/actionsServers/audit.server.actions";

interface PageProps {
	searchParams: Promise<{
		page?: string;
		usersPage?: string;
		auditPage?: string;
		search?: string;
		auditUser?: string;
		auditStartDate?: string;
		auditEndDate?: string;
	}>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  let users = [];
  let auditLogs = [];
  let usersTotalPages = 1;
  let auditTotalPages = 1;
  let currentUsersPage = 1;
  let currentAuditPage = 1;
  const searchParamsResolved = await searchParams;

  try {
    // Get current pages from URL params
    currentUsersPage = searchParamsResolved.usersPage ? parseInt(searchParamsResolved.usersPage) : 1;
    currentAuditPage = searchParamsResolved.auditPage ? parseInt(searchParamsResolved.auditPage) : 1;
    if (currentUsersPage < 1) currentUsersPage = 1;
    if (currentAuditPage < 1) currentAuditPage = 1;

    // Fetch users with pagination and search
    const usersResult = await fetchUsers({
      limit: 6,
      page: currentUsersPage,
      search: searchParamsResolved.search
    });
    if (usersResult.success) {
      users = usersResult.data?.users || [];
      usersTotalPages = usersResult.data?.pagination?.totalPages || 1;
    } else {
      console.error("Failed to fetch users:", usersResult.error);
    }

    // Fetch audit logs with pagination and filters
    const auditResult = await fetchAuditLogs({
      limit: 6,
      page: currentAuditPage,
      changedBy: searchParamsResolved.auditUser,
      startDate: searchParamsResolved.auditStartDate,
      endDate: searchParamsResolved.auditEndDate
    });
    if (auditResult.success) {
      auditLogs = auditResult.data?.logs || [];
      auditTotalPages = auditResult.data?.pagination?.totalPages || 1;
    } else {
      console.error("Failed to fetch audit logs:", auditResult.error);
    }
  } catch (error) {
    console.error("Error in UsersPage:", error);
  }

  return (
    <UsersManagement 
      users={users} 
      auditLogs={auditLogs} 
      currentUsersPage={currentUsersPage}
      currentAuditPage={currentAuditPage}
      usersTotalPages={usersTotalPages}
      auditTotalPages={auditTotalPages}
      searchQuery={searchParamsResolved.search || ''}
      auditUserFilter={searchParamsResolved.auditUser || ''}
      auditStartDate={searchParamsResolved.auditStartDate || ''}
      auditEndDate={searchParamsResolved.auditEndDate || ''}
    />
  );
}
