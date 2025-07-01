import { NextRequest, NextResponse } from "next/server";
import { get } from "@/lib/axiosServerWrapper";
import { getTokenCookie } from "@/app/utils/server/token";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function GET(request: NextRequest) {
  try {
    const tokens = request.cookies ? await getTokenCookie(request) : null;
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const url = `/audit-logs${queryString ? `?${queryString}` : ''}`;
    const res = await get(url, {
      headers: {
        Authorization: `Bearer ${tokens?.accessToken}`,
      }
    });
    
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.response?.data?.message || error?.message || "Failed to fetch audit logs",
    }, { status: 500 });
  }
} 