import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tokens = req.cookies ? await getTokenCookie(req) : null;
    const res = await axios.get(`${BACKEND_URL}/legal-updates/${id}`, {
      headers: { Authorization: `Bearer ${tokens?.accessToken}` },
    });
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return NextResponse.json(
      { success: false, error: err?.response?.data?.message || err?.message || "Failed to fetch legal update" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tokens = request.cookies ? await getTokenCookie(request) : null;
    const body = await request.json();
    const res = await axios.put(`${BACKEND_URL}/legal-updates/${id}`, body, {
      headers: { Authorization: `Bearer ${tokens?.accessToken}` },
    });
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return NextResponse.json(
      { success: false, error: err?.response?.data?.message || err?.message || "Failed to update legal update" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tokens = request.cookies ? await getTokenCookie(request) : null;
    const res = await axios.delete(`${BACKEND_URL}/legal-updates/${id}`, {
      headers: { Authorization: `Bearer ${tokens?.accessToken}` },
    });
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return NextResponse.json(
      { success: false, error: err?.response?.data?.message || err?.message || "Failed to delete legal update" },
      { status: 500 },
    );
  }
}
