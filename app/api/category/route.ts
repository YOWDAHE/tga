import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import axios from "axios";
import { get } from "@/lib/axiosWrapper";
import { setRequestCookies } from "@/lib/axiosContext";
import { cookies } from "next/headers";
import { getTokenCookie } from "@/app/utils/server/token";

const categorySchema = z.object({
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
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');

    // Build query string
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    if (search) queryParams.append('search', search);

    const queryString = queryParams.toString();
    const url = `/category${queryString ? `?${queryString}` : ''}`;

    console.log("Fetching categories from backend:", BACKEND_URL);
    const res = await get(url, {
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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = categorySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({
                success: false,
                error: parsed.error.errors.map(e => e.message).join(", "),
            }, { status: 400 });
        }
        const tokens = await getTokenCookie(req);
        if (!tokens || !tokens.accessToken) {
            return NextResponse.json({
                success: false,
                error: "Access token is missing.",
            }, { status: 401 });
        }
        const res = await axios.post(`${BACKEND_URL}/category`, parsed.data, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to create category",
        }, { status: 500 });
    }
}

