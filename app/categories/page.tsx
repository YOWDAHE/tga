// 'use client';
"use server";
import CategoriesManagement from "@/components/CategoriesManagement";
import { get } from "@/lib/axiosServerWrapper";

export default async function CategoriesPage() {
	let res;
	try {
		res = await get(`/category`);
	} catch (error) {
		console.error("Fetch error:", error);
	}
	if (!res || !res.data) {
		return <CategoriesManagement categories={[]} />;
	}
	return <CategoriesManagement categories={res.data.data} />;
}
