import { NextRequest, NextResponse } from "next/server";
import { get } from "@/lib/axiosServerWrapper";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const search = searchParams.get("q");

    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    if (search) params.append("q", search);

    const queryString = params.toString();
    const url = `/legal-updates/subscribers${queryString ? `?${queryString}` : ""}`;
    const res = await get(url);

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return NextResponse.json(
      { success: false, error: err?.response?.data?.message || err?.message || "Failed to fetch subscribers" },
      { status: 500 },
    );
  }
}
