import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getTokenCookie } from "@/app/utils/server/token";
import { BACKEND_URL, jobsError } from "../proxy";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
	try {
		const { id } = await params;
		const tokens = await getTokenCookie(request);
		const res = await axios.get(`${BACKEND_URL}/jobs/${encodeURIComponent(id)}`, {
			headers: { Authorization: `Bearer ${tokens?.accessToken}` },
		});
		return NextResponse.json({ success: true, data: res.data.data });
	} catch (error) {
		return jobsError(error, "Failed to fetch the job");
	}
}

export async function PUT(request: NextRequest, { params }: Context) {
	try {
		const { id } = await params;
		const tokens = await getTokenCookie(request);
		const body = await request.json();
		const res = await axios.put(`${BACKEND_URL}/jobs/${encodeURIComponent(id)}`, body, {
			headers: { Authorization: `Bearer ${tokens?.accessToken}` },
		});
		return NextResponse.json({ success: true, message: res.data.message, data: res.data.data });
	} catch (error) {
		return jobsError(error, "Failed to update the job");
	}
}

export async function DELETE(request: NextRequest, { params }: Context) {
	try {
		const { id } = await params;
		const tokens = await getTokenCookie(request);
		const res = await axios.delete(`${BACKEND_URL}/jobs/${encodeURIComponent(id)}`, {
			headers: { Authorization: `Bearer ${tokens?.accessToken}` },
		});
		return NextResponse.json({ success: true, message: res.data.message, data: res.data.data });
	} catch (error) {
		return jobsError(error, "Failed to delete the job");
	}
}
