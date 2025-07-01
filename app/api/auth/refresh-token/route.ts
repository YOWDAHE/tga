import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import axios from "axios";
import { cookieSettings } from "../cookieOptions";

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("tgaRefreshToken")?.value;

    if (!refreshToken) {
        return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    try {
        const res = await axios.post(`${process.env.BACKEND_API_URL}/auth/refresh-token`, {
            refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data.data;

        cookieStore.set("tgaAccessToken", accessToken, cookieSettings);
        cookieStore.set("tgaRefreshToken", newRefreshToken, cookieSettings);

        return NextResponse.json({ success: true, accessToken });
    } catch {
        return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
    }
}
