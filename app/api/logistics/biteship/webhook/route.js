import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/auditLog";
import { getLogisticsConfig, normalizeBiteshipWebhook, orderStatusForShippingStatus } from "@/lib/logistics";
import { getOrderByShippingProviderId, updateOrderShipping } from "@/lib/store";

export async function POST(request) {
  const config = getLogisticsConfig();
  if (!config.webhookToken) {
    return NextResponse.json({ error: "Webhook token is not configured." }, { status: 503 });
  }
  if (!authorized(request, config.webhookToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const shipping = normalizeBiteshipWebhook(payload);
  if (!shipping.providerOrderId) {
    return NextResponse.json({ error: "Missing Biteship order id." }, { status: 400 });
  }

  const order = await getOrderByShippingProviderId(shipping.providerOrderId);
  if (!order) {
    return NextResponse.json({ ok: true, ignored: true, reason: "order_not_found" });
  }

  if (sameShippingUpdate(order.shipping, shipping)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const orderStatus = orderStatusForShippingStatus(shipping.status, order.status);
  await updateOrderShipping(order.id, shipping, {
    note: `Biteship：${shipping.status}`,
    orderStatus
  });
  await writeAuditLog({
    action: "shipment_webhook",
    entityType: "order",
    entityId: order.id,
    summary: `物流状态更新为：${shipping.status}`,
    details: {
      provider: "biteship",
      providerOrderId: shipping.providerOrderId,
      waybillId: shipping.waybillId,
      event: shipping.lastEvent,
      shippingStatus: shipping.status,
      orderStatus
    }
  });

  return NextResponse.json({ ok: true });
}

function authorized(request, token) {
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.replace(/^Bearer\s+/i, "") || request.headers.get("x-webhook-token") || "";
  return supplied === token;
}

function sameShippingUpdate(current = {}, incoming = {}) {
  return ["status", "waybillId", "trackingId", "trackingUrl", "price", "codFee"].every(
    (key) => String(current?.[key] ?? "") === String(incoming?.[key] ?? "")
  );
}
