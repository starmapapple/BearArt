import { updateOrderStatus } from "@/lib/store";
import { createAnalyticsEvent } from "@/lib/analytics";

export async function createPaymentSession(order) {
  if (order.paymentMethod === "cod") {
    return {
      provider: "cod",
      checkoutUrl: `/checkout/pending?orderId=${order.id}`,
      status: "cod_pending"
    };
  }

  const provider = process.env.PAYMENT_PROVIDER || "cod_only";
  if (provider === "cod_only") {
    throw new Error("当前第一期只支持 COD，请选择 COD 下单。");
  }
  if (provider === "xendit") return createXenditInvoice(order);
  if (provider === "midtrans") return createMidtransSnap(order);

  const reference = `mock_${order.id}`;
  const updatedOrder = await updateOrderStatus(order.id, "awaiting_payment", {
    paymentProvider: provider,
    paymentReference: reference
  });

  return {
    provider,
    checkoutUrl: `/checkout/${order.id}`,
    status: "awaiting_payment",
    reference,
    order: updatedOrder
  };
}

async function createXenditInvoice(order) {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  const siteUrl = getSiteUrl();
  if (!secretKey || !siteUrl) {
    throw new Error("Xendit requires XENDIT_SECRET_KEY and NEXT_PUBLIC_SITE_URL.");
  }

  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${secretKey}:`)}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      external_id: order.id,
      amount: order.total,
      currency: order.currency || "IDR",
      description: `${order.productTitle} - ${order.variant || "Default"}`,
      success_redirect_url: `${siteUrl}/checkout/success?orderId=${encodeURIComponent(order.id)}`,
      failure_redirect_url: `${siteUrl}/checkout/pending?orderId=${encodeURIComponent(order.id)}`,
      customer: {
        given_names: order.customer?.name || "Customer",
        mobile_number: order.customer?.phone || undefined
      }
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Xendit invoice creation failed.");
  }

  const updatedOrder = await updateOrderStatus(order.id, "awaiting_payment", {
    paymentProvider: "xendit",
    paymentReference: payload.id || ""
  });

  return {
    provider: "xendit",
    checkoutUrl: payload.invoice_url,
    status: "awaiting_payment",
    reference: payload.id,
    order: updatedOrder
  };
}

async function createMidtransSnap(order) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const siteUrl = getSiteUrl();
  if (!serverKey || !siteUrl) {
    throw new Error("Midtrans requires MIDTRANS_SERVER_KEY and NEXT_PUBLIC_SITE_URL.");
  }

  const baseUrl = process.env.MIDTRANS_IS_PRODUCTION === "true" ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
  const response = await fetch(`${baseUrl}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${serverKey}:`)}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: order.id,
        gross_amount: order.total
      },
      item_details: [
        {
          id: order.productSlug,
          price: order.unitPrice,
          quantity: order.quantity,
          name: order.productTitle
        }
      ],
      customer_details: {
        first_name: order.customer?.name || "Customer",
        phone: order.customer?.phone || ""
      },
      callbacks: {
        finish: `${siteUrl}/checkout/success?orderId=${encodeURIComponent(order.id)}`
      },
      enabled_payments: ["bank_transfer"]
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error_messages?.join(" ") || "Midtrans transaction creation failed.");
  }

  const updatedOrder = await updateOrderStatus(order.id, "awaiting_payment", {
    paymentProvider: "midtrans",
    paymentReference: payload.token || ""
  });

  return {
    provider: "midtrans",
    checkoutUrl: payload.redirect_url,
    status: "awaiting_payment",
    reference: payload.token,
    order: updatedOrder
  };
}

export async function handleGatewayWebhook(payload) {
  const provider = payload.provider || process.env.PAYMENT_PROVIDER || "cod_only";
  const orderId = payload.orderId || payload.external_id || payload.order_id || payload.order_id;
  const paid =
    payload.status === "paid" ||
    payload.status === "settlement" ||
    payload.status === "capture" ||
    payload.status === "PAID" ||
    payload.status === "SETTLED" ||
    payload.transaction_status === "capture" ||
    payload.transaction_status === "settlement";

  if (!orderId) {
    throw new Error("Webhook payload is missing order id.");
  }

  if (!paid) {
    return updateOrderStatus(orderId, "awaiting_payment", {
      paymentProvider: provider,
      paymentReference: payload.reference || payload.id || ""
    });
  }

  const order = await updateOrderStatus(orderId, "paid", {
    paymentProvider: provider,
    paymentReference: payload.reference || payload.id || `paid_${orderId}`
  });

  if (order) {
    await createAnalyticsEvent({
      name: "payment_success",
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
      payload: { provider }
    });
  }

  return order;
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").replace(/\/$/, "");
}
