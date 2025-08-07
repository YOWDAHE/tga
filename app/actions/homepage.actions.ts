import { get, post, put } from '@/lib/axiosWrapper';

export async function updateHomepage(updateData: any) {
    try {
        const res = await put('/homepage', updateData);
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

        const res = await post('/landing/upload-partner', formData);

        if (!res.data) throw new Error(res.data.error || 'Failed to upload partner image');
        return { success: true, data: res.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}