import { z } from "zod";
import { get, put } from "@/lib/axiosWrapper";

// Zod schema for profile updates
export const profileUpdateSchema = z.object({
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email format"),
    phone_number: z.string().min(1, "Phone number is required"),
});

// Zod schema for password change
export const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type PasswordChange = z.infer<typeof passwordChangeSchema>;

// Get current user's profile
export async function getProfile() {
    try {
        const res = await get("/profile");
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Update current user's profile
export async function updateProfile(input: ProfileUpdate) {
    const parsed = profileUpdateSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors.map(e => e.message).join(", ") };
    }
    try {
        const res = await put("/profile", parsed.data);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Change current user's password
export async function changePassword(input: PasswordChange) {
    const parsed = passwordChangeSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors.map(e => e.message).join(", ") };
    }
    try {
        const res = await put("/profile/password", parsed.data);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
} 