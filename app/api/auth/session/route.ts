import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
    console.log("Fetching session from backend");
    const accessToken = (await cookies()).get("tgaAccessToken")?.value;
    if (!accessToken) {
        return NextResponse.json({ user: null, authenticated: false }, { status: 200 });
    }

    try {
        const res = await axios.get(`${process.env.BACKEND_API_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return NextResponse.json({ user: res.data.data, authenticated: true });
    } catch (error) {
        console.error("Error fetching session:", error);
        return NextResponse.json({ user: null, authenticated: false }, { status: 200 });
    }
}
