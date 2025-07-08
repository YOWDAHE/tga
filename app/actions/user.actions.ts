import { z } from "zod";
import { post, get, put, del } from "@/lib/axiosWrapper";
// import { get as getServer } from "@/lib/axiosServerWrapper";
import { UserPermission, USER_PERMISSIONS } from "@/types/permissions";

// Zod schema for user
export const userSchema = z.object({
    id: z.number().optional(),
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email format"),
    phone_number: z.string().min(1, "Phone number is required"),
    password: z.string().optional(),
    role_name: z.string().optional(),
    roles: z.array(z.enum(USER_PERMISSIONS)).optional(),
});

// Zod schema for user updates (only role_name and roles)
export const userUpdateSchema = z.object({
    id: z.number(),
    username: z.string().optional(),
    email: z.string().email("Invalid email format").optional(),
    phone_number: z.string().min(1, "Phone number is required").optional(),
    role_name: z.string().optional(),
    roles: z.array(z.enum(USER_PERMISSIONS)).optional(),
});

export type User = z.infer<typeof userSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

// Fetch all users
export async function fetchUsers() {
    try {
        const res = await get("/users");
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Fetch user by ID
export async function fetchUser(id: number) {
    try {
        const res = await get(`/users/${id}`);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Create a new user
export async function createUser(input: User) {
    const parsed = userSchema.safeParse(input);
    if (!parsed.success) {
        console.log("Parsed error:", parsed.error);
        return { success: false, error: parsed.error.errors.map(e => e.message).join(", ") };
    }
    try {
        const res = await post("/users/add", parsed.data);
        console.log("Res:", res.data.data);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        console.log("Error:", error);
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Update a user (full update)
export async function updateUser(input: User) {
    const parsed = userSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors.map(e => e.message).join(", ") };
    }
    try {
        const res = await put(`/users/${input.id}`, parsed.data);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Update user roles and role_name only
export async function updateUserRoles(input: UserUpdate) {
    const parsed = userUpdateSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors.map(e => e.message).join(", ") };
    }
    try {
        const res = await put(`/users/${input.id}`, parsed.data);
        return { success: true, data: res.data.data };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
}

// Delete a user
export async function deleteUser(id: number) {
    try {
        await del(`/users/${id}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error?.response?.data?.message || error?.message };
    }
} 