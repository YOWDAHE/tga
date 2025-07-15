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
        const { reason } = await req.json();
        
        if (!id) {
            return NextResponse.json({
                success: false,
                error: "Comment ID is required",
            }, { status: 400 });
        }

        const tokens = await getTokenCookie(req);
        if (!tokens?.accessToken) {
            return NextResponse.json({
                success: false,
                error: "Authentication required",
            }, { status: 401 });
        }

        const res = await axios.patch(`${BACKEND_URL}/comments/${id}/toggle-flag`, 
            { reason }, 
            {
                headers: {
                    Authorization: `Bearer ${tokens.accessToken}`,
                },
            }
        );

        if (!res.data) {
            return NextResponse.json({
                success: false,
                error: res.data?.error || "Failed to toggle comment flag",
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: res.data.data
        });
    } catch (error: any) {
        console.error("Toggle comment flag error:", error);
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to toggle comment flag",
        }, { status: 500 });
    }
} 