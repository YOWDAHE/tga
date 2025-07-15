import { get } from "@/lib/axiosServerWrapper";

export async function fetchCategories(params?: {
    page?: number;
    limit?: number;
    search?: string;
}) {
    try {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const url = `/category${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await get(url);
        
        return { 
            success: true, 
            data: res.data.data.categories,
            pagination: res.data.data.pagination
        };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
} 