import { get } from "@/lib/axiosServerWrapper";

export async function fetchAuditLogs(params?: {
    page?: number;
    limit?: number;
    tableName?: string;
    action?: "INSERT" | "UPDATE" | "DELETE";
    changedBy?: string;
    startDate?: string;
    endDate?: string;
    user_id?: number;
}) {
    try {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.tableName) queryParams.append('tableName', params.tableName);
        if (params?.action) queryParams.append('action', params.action);
        if (params?.changedBy) queryParams.append('changedBy', params.changedBy);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.user_id) queryParams.append('user_id', params.user_id.toString());

        const url = `/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await get(url);

        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}