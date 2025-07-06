import { get, post, put, del } from '@/lib/axiosWrapper';

export async function fetchContactInfo() {
    try {
        const res = await get('/contact');
        if (!res.data.data) throw new Error(res.data.error || 'Failed to fetch contact info');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function fetchContactInfoById(id: number) {
    try {
        const res = await get(`/contact/${id}`);
        if (!res.data.data) throw new Error(res.data.error || 'Failed to fetch contact info');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createContactInfo(data: { medium: string; email?: string; phone_number?: string }) {
    try {
        const res = await post('/contact', data);
        if (!res.data.data) throw new Error(res.data.error || 'Failed to create contact info');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateContactInfo(id: number, data: { medium: string; email?: string; phone_number?: string }) {
    try {
        const res = await put(`/contact/${id}`, data);
        if (!res.data.data) throw new Error(res.data.error || 'Failed to update contact info');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteContactInfo(id: number) {
    try {
        const res = await del(`/contact/${id}`);
        if (!res.data.success) throw new Error(res.data.error || 'Failed to delete contact info');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
} 