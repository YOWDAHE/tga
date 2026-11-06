import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

// Forwards one page-builder call with the admin's token. Error bodies pass through untouched, so the
// builder can show a 400's message and read the current layout from a 409 (someone else published).
export async function forward(req: NextRequest, method: "get" | "put", path: string, fallback: string) {
	try {
		const tokens = req.cookies ? await getTokenCookie(req) : null;
		const headers = { Authorization: `Bearer ${tokens?.accessToken}` };
		const url = `${BACKEND_URL}/landing/${path}`;
		const res = method === "put" ? await axios.put(url, await req.json(), { headers }) : await axios.get(url, { headers });
		return NextResponse.json(res.data, { status: res.status });
	} catch (error: any) {
		const status = error?.response?.status || 500;
		const body = error?.response?.data;
		if (body && typeof body === "object") return NextResponse.json(body, { status });
		return NextResponse.json({ status: "error", message: error?.message || fallback, error: fallback, data: null }, { status });
	}
}
