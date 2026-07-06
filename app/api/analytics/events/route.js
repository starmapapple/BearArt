import { NextResponse } from "next/server";
import { createAnalyticsEvent } from "@/lib/analytics";

export async function POST(request) {
  try {
    const body = await request.json();
    const event = await createAnalyticsEvent(body);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Analytics event failed." }, { status: 400 });
  }
}
