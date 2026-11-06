// Browser-side proxy for the careers admin: forwards to the backend with the session cookie's token.
// Backend statuses pass through, so a 403 lets the client refresh its token and retry, and a 400
// keeps the backend's human-readable message.
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getTokenCookie } from "@/app/utils/server/token";
import { BACKEND_URL, jobsError } from "./proxy";

export async function GET(request: NextRequest) {
	try {
		const tokens = await getTokenCookie(request);
		const { searchParams } = new URL(request.url);
		const params = new URLSearchParams();
		const q = searchParams.get("q");
		const status = searchParams.get("status");
		if (q) params.set("q", q);
		if (status) params.set("status", status);
		const qs = params.toString();
		const res = await axios.get(`${BACKEND_URL}/jobs${qs ? `?${qs}` : ""}`, {
			headers: { Authorization: `Bearer ${tokens?.accessToken}` },
		});
		return NextResponse.json({ success: true, data: res.data.data });
	} catch (error) {
		return jobsError(error, "Failed to fetch jobs");
	}
}

export async function POST(request: NextRequest) {
	try {
		const tokens = await getTokenCookie(request);
		const body = await request.json();
		const res = await axios.post(`${BACKEND_URL}/jobs`, body, {
			headers: { Authorization: `Bearer ${tokens?.accessToken}` },
		});
		return NextResponse.json({ success: true, message: res.data.message, data: res.data.data }, { status: 201 });
	} catch (error) {
		return jobsError(error, "Failed to create the job");
	}
}
