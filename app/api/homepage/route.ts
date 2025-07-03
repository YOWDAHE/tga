import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function GET(req: NextRequest) {
  try {
    const tokens = req.cookies ? await getTokenCookie(req) : null;
    const res = await axios.get(`${BACKEND_URL}/landing`, {
      headers: {
        Authorization: `Bearer ${tokens?.accessToken}`,
      },
    });
    if (!res.data) {
      return NextResponse.json({ success: false, error: res.data?.error || "Failed to fetch homepage data" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.response?.data?.message || error?.message || "Failed to fetch homepage data" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tokens = req.cookies ? await getTokenCookie(req) : null;
    const body = await req.json();
    const { id, ...updateData } = body;
    const res = await axios.put(`/landing/${id}`, updateData, {
      headers: {
        Authorization: `Bearer ${tokens?.accessToken}`,
      },
    });
    if (!res.data) {
      return NextResponse.json({ success: false, error: res.data?.error || "Failed to update homepage data" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.response?.data?.message || error?.message || "Failed to update homepage data" }, { status: 500 });
  }
} 