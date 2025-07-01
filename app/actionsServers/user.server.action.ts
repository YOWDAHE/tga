import { get } from "@/lib/axiosServerWrapper";

export async function fetchUsers(params?: {
    page?: number;
    limit?: number;
}) {
    try {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await get(url);

        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}