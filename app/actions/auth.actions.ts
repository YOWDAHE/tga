import { z } from "zod";
import { userSignInResponseSchema } from "@/app/types/user.type";

// Define login input schema
const loginInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const LOGIN_API_URL = "/auth/signin";

export async function loginAction(username: string, password: string) {
  // Validate input
  const parsed = loginInputSchema.safeParse({ username, password });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    const axios = (await import("axios")).default;
    const res = await axios.post("/office/api/auth/signin", parsed.data, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    const data = res.data;

    return {
      success: true,
      data: {
        user: data.data?.user,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.error || error?.message || "Network or server error",
    };
  }
}

