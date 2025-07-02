"use client";

export async function createNews(data: any) {
    try {
        let formData: FormData | null = null;
        if (data.visual_content instanceof File) {
            formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (key === "visual_content" && value instanceof File) {
                    formData!.append("visual_content", value);
                } else if (value !== undefined && value !== null) {
                    formData!.append(key, String(value));
                }
            });
        }
        const res = await fetch("/api/news", {
            method: "POST",
            body: formData || JSON.stringify(data),
            headers: formData ? undefined : { "Content-Type": "application/json" },
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to create news");
        return { success: true, data: result.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateNews(data: any) {
    try {
        const { id, ...rest } = data;
        let formData: FormData | null = null;
        if (rest.visual_content instanceof File) {
            formData = new FormData();
            Object.entries(rest).forEach(([key, value]) => {
                if (key === "visual_content" && value instanceof File) {
                    formData!.append("visual_content", value);
                } else if (value !== undefined && value !== null) {
                    formData!.append(key, String(value));
                }
            });
        }
        const res = await fetch(`/api/news/${id}`, {
            method: "PUT",
            body: formData || JSON.stringify(rest),
            headers: formData ? undefined : { "Content-Type": "application/json" },
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to update news");
        return { success: true, data: result.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteNews(id: number) {
    try {
        const res = await fetch(`/api/news/${id}`, {
            method: "DELETE",
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to delete news");
        return { success: true, data: result.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
} 