import { get } from "@/lib/axiosServerWrapper";

export async function fetchNews(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    order?: string;
}) {
    try {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('q', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.order) queryParams.append('order', params.order);

        const url = `/news${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await get(url);

        console.log(res.data.data);

        return {
            success: true,
            data: res.data.data.news,
            pagination: res.data.data.pagination
        };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

export async function fetchNewsById(id: string) {
    try {
        const res = await get(`/news/${id}`);
        
        return {
            success: true,
            data: res.data.data
        };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}
