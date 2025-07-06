import { get, put } from '@/lib/axiosWrapper';

export async function updateHomepage(updateData: any) {
    try {
        const res = await put('/homepage', updateData);
        if (!res.data.data) throw new Error(res.data.error || 'Failed to update homepage');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}