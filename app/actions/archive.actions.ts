import { z } from "zod";
import { post, get, put, del } from "@/lib/axiosWrapper";
import { Document } from "@/types";

// Zod schema for document
export const documentSchema = z.object({
    id: z.number().optional(),
    filename: z.string().min(1, "Filename is required"),
    title: z.string().min(1, "Title is required"),
    category_id: z.number().min(1, "Category is required"),
    author: z.string().optional(),
    content_text: z.string().optional(),
    file_url: z.string().min(1, "File URL is required"),
    public_id: z.string().optional(),
    view_count: z.number().optional(),
});

// Zod schema for document updates
export const documentUpdateSchema = z.object({
    id: z.number(),
    title: z.string().min(1, "Title is required"),
    category_id: z.number().min(1, "Category is required"),
    author: z.string().optional(),
    description: z.string().optional(),
    seo_keywords: z.string().optional(),
});

export type DocumentInput = z.infer<typeof documentSchema>;
export type DocumentUpdate = z.infer<typeof documentUpdateSchema>;

// Fetch all documents
export async function fetchDocuments() {
    try {
        const res = await get("/documents");
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Fetch document by ID
export async function fetchDocument(id: number) {
    try {
        const res = await get(`/documents/${id}`);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Create a new document
export async function createDocument(input: DocumentInput) {
    const parsed = documentSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors.map(e => e.message).join(", ") };
    }
    try {
        const res = await post("/archives", parsed.data);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Update a document
export async function updateDocument(input: DocumentUpdate) {
    const parsed = documentUpdateSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors.map(e => e.message).join(", ") };
    }
    try {
        const res = await put(`/archives/${input.id}`, parsed.data);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Delete a document
export async function deleteDocument(id: number) {
    try {
        console.log("Deleting document:", id);
        const res = await del(`/archives/${id}`);
        console.log("Document deleted:", res.data);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Upload a document file
export async function uploadDocument(formData: FormData) {
	try {
		// Let axios set multipart boundary (do not send Content-Type: multipart/form-data alone).
		const res = await post("/archives/add", formData);
		return { success: true, data: res.data.data };
	} catch (error: any) {
		return { success: false, error: error?.response?.data?.message || error?.message };
	}
} 