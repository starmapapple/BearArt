"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analyticsClient";

export default function PaymentSuccessTracker({ order }) {
  useEffect(() => {
    const payload = {
      content_ids: [order.productSlug],
      content_name: order.productTitle,
      value: order.total,
      currency: order.currency || "IDR"
    };

    trackEvent("payment_success", {
      productId: order.productId,
      productSlug: order.productSlug,
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      value: order.total,
      city: order.city,
      province: order.province
    });

    if (window.fbq) window.fbq("track", "Purchase", payload);
    if (window.ttq) window.ttq.track("Purchase", payload);
  }, [order]);

  return null;
}
