import { NextResponse } from "next/server";
import { createAnalyticsEvent } from "@/lib/analytics";
import { writeAuditLog } from "@/lib/auditLog";
import { updateOrderStatus } from "@/lib/store";

const ALLOWED_STATUSES = new Set(["cod_confirmed", "paid", "fulfilled", "delivered", "cancelled", "expired"]);

export async function POST(request, context) {
  const { id } = await context.params;
  const form = await request.formData();
  const status = String(form.get("status") || "");
  const returnTo = safeReturnTo(String(form.get("returnTo") || "/admin/orders"));

  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "不支持的订单状态。" }, { status: 400 });
  }

  const order = await updateOrderStatus(id, status, {
    note: String(form.get("note") || status)
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在。" }, { status: 404 });
  }

  await createAnalyticsEvent({
    name: "order_status_changed",
    productId: order.productId,
    productSlug: order.productSlug,
    orderId: order.id,
    paymentMethod: order.paymentMethod,
    value: order.total,
    visitorId: order.analytics?.visitorId,
    sessionId: order.analytics?.sessionId,
    firstAttribution: order.analytics?.firstAttribution,
    lastAttribution: order.analytics?.lastAttribution || order.utm,
    city: order.customer?.city,
    province: order.customer?.province,
    payload: { status }
  });

  await writeAuditLog({
    action: "order_status_changed",
    entityType: "order",
    entityId: order.id,
    summary: `订单状态更新为：${status}`,
    details: {
      orderId: order.id,
      productSlug: order.productSlug,
      status,
      note: String(form.get("note") || status)
    }
  });

  return NextResponse.redirect(new URL(returnTo, request.url), { status: 303 });
}

function safeReturnTo(value) {
  return value.startsWith("/admin/orders") && !value.startsWith("//") ? value : "/admin/orders";
}
