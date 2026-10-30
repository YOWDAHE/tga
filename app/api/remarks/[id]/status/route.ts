import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tokens = req.cookies ? await getTokenCookie(req) : null;
        const body = await req.json();
        const res = await axios.patch(`${BACKEND_URL}/remark/${id}/status`, body, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
        });
        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.response?.data?.message || error?.message || "Failed to update status" }, { status: error?.response?.status || 500 });
    }
}
