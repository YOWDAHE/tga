import { del, post, put } from "@/lib/axiosWrapper";

export async function createNews(data: any) {
    try {
        let formData: FormData | null = null;
        
        // Check if there are files in visual_content
        const hasFiles = data.visual_content && (
            data.visual_content instanceof File || 
            (Array.isArray(data.visual_content) && data.visual_content.some((item: any) => item instanceof File))
        );
        
        if (hasFiles) {
            formData = new FormData();
            
            console.log('Creating FormData with files:', data.visual_content);
            
            // Handle visual_content - can be single file or array of files
            if (Array.isArray(data.visual_content)) {
                data.visual_content.forEach((file: File, index: number) => {
                    if (file instanceof File) {
                        console.log('Appending file:', file.name, file.size);
                        formData!.append('visual_content', file);
                    }
                });
            } else if (data.visual_content instanceof File) {
                console.log('Appending single file:', data.visual_content.name, data.visual_content.size);
                formData.append('visual_content', data.visual_content);
            }
            
            // Add other fields
            Object.entries(data).forEach(([key, value]) => {
                if (key !== 'visual_content' && value !== undefined && value !== null) {
                    formData!.append(key, String(value));
                }
            });
            
            console.log('FormData entries:');
            for (const [key, value] of formData.entries()) {
                console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
            }
        }
        
        const res = await post("/news", formData || data);
        if (!res.data.data) throw new Error(res.data.error || "Failed to create news");
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateNews(data: any) {
    try {
        console.log("data", data);
        const { id, ...rest } = data;
        let formData: FormData | null = null;

        // Check if there are files or strings in visual_content
        const hasVisualContent = rest.visual_content && Array.isArray(rest.visual_content) && rest.visual_content.length > 0;

        if (hasVisualContent) {
            formData = new FormData();

            // Append both File objects and strings (existing image URLs)
            rest.visual_content.forEach((item: any) => {
                if (item instanceof File) {
                    formData!.append('visual_content', item);
                } else if (typeof item === 'string') {
                    formData!.append('visual_content', item);
                }
            });

            // Add other fields
            Object.entries(rest).forEach(([key, value]) => {
                if (key !== 'visual_content' && value !== undefined && value !== null) {
                    formData!.append(key, String(value));
                }
            });
        }

        console.dir(`Updating news with id: ${formData ? `FormData with ${formData.getAll('visual_content').length} items` : 'no files'}`, { depth: null });
        const res = await put(`/news/${id}`, formData || rest);
        if (!res.data.data) throw new Error(res.data.error || "Failed to update news");
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteNews(id: number) {
    try {
        console.log("deleteNews id", id);
        const res = await del(`/news/${id}`);
        if (!res.data.data) throw new Error(res.data.error || "Failed to delete news");
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}