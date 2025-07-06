import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(req: NextRequest) {
    try {
        const tokens = req.cookies ? await getTokenCookie(req) : null;
        
        // Get the form data from the request
        const formData = await req.formData();
        
        // Forward the form data to the backend
        const res = await axios.post(`${BACKEND_URL}/landing/upload`, formData, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        
        if (!res.data) {
            return NextResponse.json({ 
                success: false, 
                error: res.data?.error || "Failed to upload image" 
            }, { status: 500 });
        }
        
        return NextResponse.json({ 
            success: true, 
            data: res.data.data 
        });
    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            error: error?.response?.data?.message || error?.message || "Failed to upload image" 
        }, { status: 500 });
    }
} 