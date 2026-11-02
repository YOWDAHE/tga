import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";
import { adminUrl } from "../adminUrl";

const BACKEND_URL = process.env.BACKEND_API_URL;

// Sends the admin to LinkedIn to approve posting to the company page
export async function GET(req: NextRequest) {
    const back = adminUrl(req, "/news");
    try {
        const tokens = await getTokenCookie(req);
        const res = await axios.get(`${BACKEND_URL}/social/linkedin/auth-url`, {
            headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        });
        return NextResponse.redirect(res.data.data.url);
    } catch (error: any) {
        back.searchParams.set("linkedin_error", error?.response?.data?.error || error?.message || "Could not start the LinkedIn connection");
        return NextResponse.redirect(back);
    }
}
