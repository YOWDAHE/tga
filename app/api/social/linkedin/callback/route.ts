import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";
import { adminUrl } from "../adminUrl";

const BACKEND_URL = process.env.BACKEND_API_URL;

// LinkedIn redirects here after the admin approves (or cancels) the connection
export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const back = adminUrl(req, "/news");

    if (params.get("error")) {
        back.searchParams.set("linkedin_error", params.get("error_description") || params.get("error")!);
        return NextResponse.redirect(back);
    }

    try {
        const tokens = await getTokenCookie(req);
        await axios.post(`${BACKEND_URL}/social/linkedin/callback`, {
            code: params.get("code"),
            state: params.get("state"),
        }, {
            headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        });
        back.searchParams.set("linkedin", "connected");
    } catch (error: any) {
        back.searchParams.set("linkedin_error", error?.response?.data?.message || error?.message || "Failed to connect LinkedIn");
    }
    return NextResponse.redirect(back);
}
