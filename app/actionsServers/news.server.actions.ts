import { get } from "@/lib/axiosServerWrapper";

export async function fetchNews(params?: {
    page?: number;
    limit?: number;
    search?: string;
}) {
    try {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('q', params.search);

        const url = `/news${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await get(url);

        return {
            success: true,
            data: res.data.data.news,
            pagination: res.data.data.pagination
        };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}
