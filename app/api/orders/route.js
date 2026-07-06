import { NextResponse } from "next/server";
import { createAnalyticsEvent } from "@/lib/analytics";
import { INDONESIA_NAME_HINT, validateIndonesiaName } from "@/lib/nameValidation";
import { createPaymentSession } from "@/lib/payments";
import { INDONESIA_PHONE_HINT, validateIndonesiaWhatsapp } from "@/lib/phone";
import { createOrder, getOrderById, getOrders } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ orders: await getOrders() });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const required = ["name", "phone", "address", "city", "province"];
    for (const key of required) {
      if (!body.customer?.[key]) {
        return NextResponse.json({ error: "请填写完整的收货信息。" }, { status: 400 });
      }
    }

    if (String(body.customer.address || "").trim().length < 8) {
      return NextResponse.json({ error: "Alamat lengkap wajib diisi, minimal 8 karakter." }, { status: 400 });
    }

    const nameValidation = validateIndonesiaName(body.customer.name);
    if (!nameValidation.valid) {
      return NextResponse.json({ error: INDONESIA_NAME_HINT }, { status: 400 });
    }

    const phoneValidation = validateIndonesiaWhatsapp(body.customer.phone);
    if (!phoneValidation.valid) {
      return NextResponse.json({ error: INDONESIA_PHONE_HINT }, { status: 400 });
    }

    body.customer.name = nameValidation.normalized;
    body.customer.phone = phoneValidation.e164;

    const order = await createOrder(body);
    await createAnalyticsEvent({
      name: "order_created",
      productId: order.productId,
      productSlug: order.productSlug,
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      value: order.total,
      visitorId: body.analytics?.visitorId,
      sessionId: body.analytics?.sessionId,
      firstAttribution: body.analytics?.firstAttribution,
      lastAttribution: body.analytics?.lastAttribution || body.utm,
      city: order.customer?.city,
      province: order.customer?.province,
      pageUrl: order.pageUrl,
      payload: { source: "server_order_api" }
    });
    const payment = await createPaymentSession(order);
    const currentOrder = (await getOrderById(order.id)) || order;
    return NextResponse.json({
      order: currentOrder,
      checkoutUrl: payment.checkoutUrl,
      payment
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
