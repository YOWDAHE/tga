import { get, post, put, del } from '@/lib/axiosWrapper';

export async function fetchRemarks() {
    try {
        const res = await get('/remarks');
        if (!res.data.data) throw new Error(res.data.error || 'Failed to fetch remarks');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function fetchRemarkById(id: number) {
    try {
        const res = await get(`/remarks/${id}`);
        if (!res.data.data) throw new Error(res.data.error || 'Failed to fetch remark');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createRemark(data: { name: string; email: string; content: string }) {
    try {
        const res = await post('/remarks', data);
        if (!res.data.data) throw new Error(res.data.error || 'Failed to create remark');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateRemark(id: number, data: { name: string; email: string; content: string }) {
    try {
        const res = await put(`/remarks/${id}`, data);
        if (!res.data.data) throw new Error(res.data.error || 'Failed to update remark');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteRemark(id: number) {
    try {
        const res = await del(`/remarks/${id}`);
        if (!res.data.success) throw new Error(res.data.error || 'Failed to delete remark');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function replyToRemark(id: number, data: { subject: string; response: string }) {
    try {
        const res = await post(`/remarks/reply/${id}`, data);
        if (!res.data.success) throw new Error(res.data.error || 'Failed to send reply');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
} 