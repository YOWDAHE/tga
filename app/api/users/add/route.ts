import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import { userSchema } from "@/app/actions/user.actions";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = userSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({
                success: false,
                error: parsed.error.errors.map(e => e.message).join(", "),
            }, { status: 400 });
        }

        const tokens = req.cookies ? await getTokenCookie(req) : null;
        const res = await axios.post(`${BACKEND_URL}/users`, parsed.data, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
        });
        
        return NextResponse.json({ 
            success: true, 
            data: res.data.data 
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to create user",
        }, { status: 500 });
    }
} 