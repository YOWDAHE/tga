import axios from "axios";
import { cookies } from "next/headers";
import { get } from "./axiosWrapper";


export async function getCategories() {
    const accessToken = (await cookies()).get("tgaAccessToken")?.value;

    if (!accessToken) {
        throw new Error("No access token found");
    }

    try {
        const res = await get(`/category`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return res.data.data;
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
    }
}