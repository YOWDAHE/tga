import { get } from '@/lib/axiosServerWrapper';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function fetchHomepage() {
    try {
        const res = await get(`/landing`);
        if (!res.data.data) throw new Error(res.data.error || 'Failed to fetch homepage');
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}