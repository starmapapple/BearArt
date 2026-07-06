import { NextResponse } from "next/server";
import { findCustomerOrders } from "@/lib/store";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone") || "";
  const orderId = searchParams.get("orderId") || "";

  if (!phone && !orderId) {
    return NextResponse.json({ error: "请输入订单号或 WhatsApp 手机号。" }, { status: 400 });
  }

  const orders = await findCustomerOrders({ phone, orderId });
  return NextResponse.json({ orders });
}
