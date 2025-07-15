import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(req: NextRequest) {
    try {
        const tokens = req.cookies ? await getTokenCookie(req) : null;
        
        const res = await axios.post(`${BACKEND_URL}/uploads/migrate-cloudinary`, {}, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        return NextResponse.json({
            success: true,
            data: res.data.data
        });
    } catch (error: any) {
        console.error("Migration error:", error);
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to migrate documents",
        }, { status: 500 });
    }
} 