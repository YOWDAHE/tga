import { NextRequest } from "next/server";
import { forward } from "../proxy";

type Params = { params: Promise<{ key: string }> };

// Publish a page: { modules, note?, baseUpdatedAt? }
export async function PUT(req: NextRequest, { params }: Params) {
	const { key } = await params;
	return forward(req, "put", `pages/${encodeURIComponent(key)}`, "Failed to publish the page");
}
