import { z } from "zod";
import { get } from "@/lib/axiosWrapper";
// import { get as getServer } from "@/lib/axiosServerWrapper";

// Zod schema for audit log
export const auditLogSchema = z.object({
    id: z.number(),
    tableName: z.string(),
    action: z.enum(["INSERT", "UPDATE", "DELETE"]),
    description: z.string(),
    oldData: z.any().nullable(),
    newData: z.any().nullable(),
    user_id: z.number(),
    changedBy: z.string().nullable(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    changeTimestamp: z.string(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

// Fetch all audit logs with filtering and pagination
// export async function fetchAuditLogs(params?: {
//     page?: number;
//     limit?: number;
//     tableName?: string;
//     action?: "INSERT" | "UPDATE" | "DELETE";
//     changedBy?: string;
//     startDate?: string;
//     endDate?: string;
//     user_id?: number;
// }) {
//     try {
//         const queryParams = new URLSearchParams();

//         if (params?.page) queryParams.append('page', params.page.toString());
//         if (params?.limit) queryParams.append('limit', params.limit.toString());
//         if (params?.tableName) queryParams.append('tableName', params.tableName);
//         if (params?.action) queryParams.append('action', params.action);
//         if (params?.changedBy) queryParams.append('changedBy', params.changedBy);
//         if (params?.startDate) queryParams.append('startDate', params.startDate);
//         if (params?.endDate) queryParams.append('endDate', params.endDate);
//         if (params?.user_id) queryParams.append('user_id', params.user_id.toString());

//         const url = `/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
//         const res = await getServer(url);

//         return { success: true, data: res.data.data };
//     } catch (error: any) {
//         return { success: false, error: error?.response?.data?.message || error?.message };
//     }
// }

// Fetch audit log by ID
export async function fetchAuditLog(id: number) {
    try {
        const res = await get(`/audit-logs/${id}`);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Fetch audit logs by table name
export async function fetchAuditLogsByTable(tableName: string, params?: {
    page?: number;
    limit?: number;
}) {
    try {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const url = `/audit-logs/table/${tableName}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await get(url);

        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
} 