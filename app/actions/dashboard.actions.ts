import { get } from '@/lib/axiosWrapper';

export async function getDashboardData() {
    try {
        const res = await get('/dashboard');
        if (!res.data.data) throw new Error(res.data.error || 'Failed to fetch dashboard data');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
} 