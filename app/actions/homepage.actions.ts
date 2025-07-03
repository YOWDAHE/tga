import { get, put } from '@/lib/axiosWrapper';

export async function updateHomepage(id: number, updateData: any) {
  try {
    const res = await put('/api/homepage', { id, ...updateData });
    if (!res.data.data) throw new Error(res.data.error || 'Failed to update homepage');
    return { success: true, data: res.data.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
} 