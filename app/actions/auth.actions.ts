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
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });

    
    if (!res.ok) {
      // console.log("Problem: ", res)
      return {
        success: false,
        error: "Invalid response from server",
      };
    }
    const data = await res.json();
    
    // const parsedResponse = userSignInResponseSchema.safeParse(data);
    // if (!parsedResponse.success) {
    //   return { success: false, error: "Invalid response from server" };
    // }

    return {
      success: true,
      data: {
        user: data.data?.user,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Network or server error",
    };
  }
}

