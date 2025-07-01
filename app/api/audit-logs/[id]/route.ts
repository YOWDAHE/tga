import { NextRequest, NextResponse } from "next/server";
import { get } from "@/lib/axiosWrapper";
import { getTokenCookie } from "@/app/utils/server/token";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const tokens = request.cookies ? await getTokenCookie(request) : null;
        const res = await get(`/audit-logs/${params.id}`, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
            }
        });
        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to fetch audit log",
        }, { status: 500 });
    }
} 