import { NextResponse } from "next/server";
import { handleGatewayWebhook } from "@/lib/payments";

export async function POST(request) {
  try {
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.XENDIT_CALLBACK_TOKEN || "";
    if (webhookSecret) {
      const received =
        request.headers.get("x-callback-token") ||
        request.headers.get("x-webhook-token") ||
        request.headers.get("x-signature") ||
        "";
      if (received !== webhookSecret) {
        return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
      }
    }

    const payload = await request.json();
    const order = await handleGatewayWebhook(payload);
    if (!order) {
      return NextResponse.json({ error: "订单不存在。" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
