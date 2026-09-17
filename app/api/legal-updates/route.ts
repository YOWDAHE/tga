import { NextRequest, NextResponse } from "next/server";
import { get, post } from "@/lib/axiosServerWrapper";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const search = searchParams.get("q") || searchParams.get("search");
    const sortBy = searchParams.get("sortBy");
    const order = searchParams.get("order");
    const content_type = searchParams.get("content_type");
    const category = searchParams.get("category");

    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    if (search) params.append("q", search);
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);
    if (content_type) params.append("content_type", content_type);
    if (category) params.append("category", category);

    const queryString = params.toString();
    const url = `/legal-updates${queryString ? `?${queryString}` : ""}`;
    const res = await get(url);

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return NextResponse.json(
      { success: false, error: err?.response?.data?.message || err?.message || "Failed to fetch legal updates" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await post("/legal-updates", body);
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; data?: { message?: string } };
    console.error("Legal update create error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.data?.message || err?.message || "Failed to create legal update",
      },
      { status: err?.status || 500 },
    );
  }
}
