import { NextRequest, NextResponse } from "next/server";
import { get } from "@/lib/axiosWrapper";
import { getTokenCookie } from "@/app/utils/server/token";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    const { tableName } = await params;
    const tokens = request.cookies ? await getTokenCookie(request) : null;
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const url = `/audit-logs/table/${tableName}${queryString ? `?${queryString}` : ''}`;
    const res = await get(url, {
      headers: {
        Authorization: `Bearer ${tokens?.accessToken}`,
      }
    });
    
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.response?.data?.message || error?.message || "Failed to fetch audit logs by table",
    }, { status: 500 });
  }
} 