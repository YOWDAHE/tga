import { get } from "@/lib/axiosServerWrapper";

export async function fetchCategories() {
    try {
        const res = await get("/category");
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
} 