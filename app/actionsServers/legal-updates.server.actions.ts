import { get } from "@/lib/axiosServerWrapper";

export async function fetchLegalUpdates(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: string;
  content_type?: string;
  category?: string;
}) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("q", params.search);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.order) queryParams.append("order", params.order);
    if (params?.content_type) queryParams.append("content_type", params.content_type);
    if (params?.category) queryParams.append("category", params.category);

    const url = `/legal-updates${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const res = await get(url);

    return {
      success: true,
      data: res.data.data.legalUpdates,
      pagination: res.data.data.pagination,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return { success: false, error: err?.response?.data?.message || err?.message };
  }
}

export async function fetchLegalUpdateById(id: string) {
  try {
    const res = await get(`/legal-updates/${id}`);
    return { success: true, data: res.data.data };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return { success: false, error: err?.response?.data?.message || err?.message };
  }
}

export async function fetchLegalUpdateSubscribers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("q", params.search);

    const url = `/legal-updates/subscribers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const res = await get(url);

    return {
      success: true,
      data: res.data.data.subscribers,
      pagination: res.data.data.pagination,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return { success: false, error: err?.response?.data?.message || err?.message };
  }
}
