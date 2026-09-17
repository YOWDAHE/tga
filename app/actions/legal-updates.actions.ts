import { del, post, put } from "@/lib/axiosWrapper";

export async function createLegalUpdate(data: Record<string, unknown>) {
  try {
    const res = await post("/legal-updates", data);
    if (!res.data.data) throw new Error(res.data.error || "Failed to create legal update");
    return { success: true, data: res.data.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create legal update";
    return { success: false, error: message };
  }
}

export async function updateLegalUpdate(data: Record<string, unknown> & { id: number }) {
  try {
    const { id, ...rest } = data;
    const res = await put(`/legal-updates/${id}`, rest);
    if (!res.data.data) throw new Error(res.data.error || "Failed to update legal update");
    return { success: true, data: res.data.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update legal update";
    return { success: false, error: message };
  }
}

export async function deleteLegalUpdate(id: number) {
  try {
    const res = await del(`/legal-updates/${id}`);
    if (!res.data.data) throw new Error(res.data.error || "Failed to delete legal update");
    return { success: true, data: res.data.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete legal update";
    return { success: false, error: message };
  }
}

export async function deleteLegalUpdateSubscriber(id: number) {
  try {
    const res = await del(`/legal-updates/subscribers/${id}`);
    return { success: true, data: res.data.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to remove subscriber";
    return { success: false, error: message };
  }
}
