import { NextRequest, NextResponse } from "next/server";
import { get, put, del } from "@/lib/axiosServerWrapper";
import { userSchema, userUpdateSchema } from "@/app/actions/user.actions";
import { getTokenCookie } from "@/app/utils/server/token";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokens = request.cookies ? await getTokenCookie(request) : null;
    const res = await get(`/users/${id}`, {
      headers: {
        Authorization: `Bearer ${tokens?.accessToken}`,
      }
    });
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.response?.data?.message || error?.message || "Failed to fetch user",
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokens = request.cookies ? await getTokenCookie(request) : null;
    const body = await request.json();
    
    // Use userUpdateSchema for partial updates
    const parsed = userUpdateSchema.safeParse({ ...body, id: Number(id) });
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.errors.map(e => e.message).join(", "),
      }, { status: 400 });
    }
    
    const res = await put(`/users/${id}`, parsed.data, {
      headers: {
        Authorization: `Bearer ${tokens?.accessToken}`,
      }
    });
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.response?.data?.message || error?.message || "Failed to update user",
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokens = request.cookies ? await getTokenCookie(request) : null;
    await del(`/users/${id}`, {
      headers: {
        Authorization: `Bearer ${tokens?.accessToken}`,
      }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.response?.data?.message || error?.message || "Failed to delete user",
    }, { status: 500 });
  }
} 