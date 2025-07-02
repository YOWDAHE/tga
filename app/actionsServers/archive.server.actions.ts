import { get } from "@/lib/axiosServerWrapper";

export async function fetchDocuments(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sortBy?: string;
    order?: string;
}) {
    try {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('q', params.search);
        if (params?.category) queryParams.append('category', params.category);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.order) queryParams.append('order', params.order);

        const url = `/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res = await get(url);

        return { 
            success: true, 
            data: res.data.data.documents,
            pagination: res.data.data.pagination
        };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

export async function fetchDocument(id: string) {
    try {
        const url = `/uploads/${id}`;
        const res = await get(url);

        return {
            success: true,
            data: res.data.data
        };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

export async function getCategories() {
    try {
        const res = await get("/category");

        // Transform the data to match the expected format for Mantine Select
        // Filter out categories with invalid or missing IDs
        const transformedData = res.data.data
            .filter((category: any) => category.id != null && category.id !== undefined && category.name)
            .map((category: any) => ({
                value: category.id.toString(),
                label: category.name,
            }))
            // Remove duplicates based on value
            .filter((item: any, index: number, self: any[]) => 
                index === self.findIndex((t: any) => t.value === item.value)
            );

        return {
            success: true,
            data: transformedData
        };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}