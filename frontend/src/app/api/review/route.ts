import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, rating, review_text } = body;

    if (!customer_name || !rating || !review_text) {
      return NextResponse.json({ success: false, message: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const secret = process.env.INTERNAL_API_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, message: "Server config error" }, { status: 500 });
    }

    const res = await fetch(`${backendUrl}/process-review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": secret,
      },
      body: JSON.stringify({ customer_name, rating, review_text }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: data.detail || "Backend error" },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { success: false, message: "تعذر الاتصال بالخادم" },
      { status: 500 }
    );
  }
}
