import { get } from '@/lib/axiosServerWrapper';

export async function fetchContactInfoServer() {
    try {
        const res = await get('/contact');
        if (!res.data.data) throw new Error(res.data.error || 'Failed to fetch contact info');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function fetchContactInfoByIdServer(id: number) {
    try {
        const res = await get(`/contact/${id}`);
        if (!res.data.data) throw new Error(res.data.error || 'Failed to fetch contact info');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
} 