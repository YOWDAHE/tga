import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import axios from "axios";
import { get } from "@/lib/axiosWrapper";
import { setRequestCookies } from "@/lib/axiosContext";
import { cookies } from "next/headers";
import { getTokenCookie } from "@/app/utils/server/token";

export const categorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function GET(request: NextRequest) {
  const tokens = await getTokenCookie(request);
  if (!tokens || !tokens.accessToken) {
    return NextResponse.json({
      success: false,
      error: "Access token is missing.",
    }, { status: 401 });
  }

  try {
    console.log("Fetching categories from backend:", BACKEND_URL);
    const res = await get(`/category`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.response?.data?.message || error?.message || "Failed to fetch categories",
    }, { status: 500 });
  }
}

