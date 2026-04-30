import { z } from "zod";
import { post, get, put, del } from "@/lib/axiosWrapper";
import { CategoryInput, categorySchema } from "../types/category.type";

// Fetch all categories
export async function fetchCategories() {
	try {
		const res = await get("category");
		return { success: true, data: res.data.data };
	} catch (error: any) {
		return { success: false, error: error?.response?.data?.message || error?.message };
	}
}

export async function fetchCategory(id: number) {
    try {
        const res = await get(`category/${id}`);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Create a new category
export async function createCategory(input: CategoryInput) {
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors.map(e => e.message).join(", ") };
    }
    try {
        const res = await post("/category", parsed.data);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Update a category
export async function updateCategory(input: CategoryInput) {
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors.map(e => e.message).join(", ") };
    }
    try {
        const res = await put(`/category/${input.id}`, parsed.data);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Delete a category
export async function deleteCategory(id: number) {
    try {
        await del(`/category/${id}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}
