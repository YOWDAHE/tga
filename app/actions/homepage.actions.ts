import { get, post, put, del } from '@/lib/axiosWrapper';

export async function updateHomepage(updateData: any) {
    try {
        const res = await put('homepage', updateData);
        if (!res.data.data) throw new Error(res.data.error || 'Failed to update homepage');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function uploadHomepageImage(file: File, imageType: 'hero_image' | 'logo') {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('imageType', imageType);

        const res = await fetch('/office/api/landing/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Failed to upload image');
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function uploadPartnerImage(file: File) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await post('landing/upload-partner', formData);

        if (!res.data) throw new Error(res.data.error || 'Failed to upload partner image');
        return { success: true, data: res.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
export type HomepageSection = 'stats' | 'practices' | 'partners' | 'contactUs' | 'newsLinks';

// Single-item edits: each call touches exactly one row on the server
export async function createHomepageItem<T = any>(section: HomepageSection, data: Record<string, any>) {
    try {
        const res = await post(`homepage/items/${section}/`, data);
        if (!res.data?.success) throw new Error(res.data?.error || 'Failed to add item');
        return { success: true as const, data: res.data.data as T };
    } catch (error: any) {
        return { success: false as const, error: error.message as string };
    }
}

export async function updateHomepageItem<T = any>(section: HomepageSection, id: number, data: Record<string, any>) {
    try {
        const res = await put(`homepage/items/${section}/${id}/`, data);
        if (!res.data?.success) throw new Error(res.data?.error || 'Failed to update item');
        return { success: true as const, data: res.data.data as T };
    } catch (error: any) {
        return { success: false as const, error: error.message as string };
    }
}

export async function deleteHomepageItem(section: HomepageSection, id: number) {
    try {
        const res = await del(`homepage/items/${section}/${id}/`);
        if (!res.data?.success) throw new Error(res.data?.error || 'Failed to delete item');
        return { success: true as const };
    } catch (error: any) {
        return { success: false as const, error: error.message as string };
    }
}
