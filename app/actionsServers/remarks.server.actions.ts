import { get } from '@/lib/axiosServerWrapper';

export async function fetchRemarksServer() {
    try {
        const res = await get('/remark');
        if (!res.data.data) throw new Error(res.data.error || 'Failed to fetch remarks');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function fetchRemarkByIdServer(id: number) {
    try {
        const res = await get(`/remark/${id}`);
        if (!res.data.data) throw new Error(res.data.error || 'Failed to fetch remark');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
} 