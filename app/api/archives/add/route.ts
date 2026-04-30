import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const tokens = req.cookies ? await getTokenCookie(req) : null;

		// Do not set Content-Type: axios adds multipart boundary automatically for FormData.
		const res = await axios.post(`${BACKEND_URL}/uploads`, formData, {
			headers: {
				...(tokens?.accessToken && { Authorization: `Bearer ${tokens.accessToken}` }),
			},
			maxBodyLength: Infinity,
			maxContentLength: Infinity,
		});

		return NextResponse.json({
			success: true,
			data: res.data.data,
		});
	} catch (error: any) {
		console.error("Upload error:", error);
		const status = error?.response?.status ?? 500;
		return NextResponse.json(
			{
				success: false,
				error:
					error?.response?.data?.message ||
					error?.response?.data?.error ||
					error?.message ||
					"Failed to upload document",
			},
			{ status: status >= 400 && status < 600 ? status : 500 }
		);
	}
}
