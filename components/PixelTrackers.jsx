"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analyticsClient";

export default function PixelTrackers({ product }) {
  useEffect(() => {
    const event = {
      productId: product.id,
      productSlug: product.slug,
      value: product.price,
      currency: product.currency || "IDR",
      utm: Object.fromEntries(new URLSearchParams(window.location.search))
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "landing_view", ...event });
    trackEvent("page_view", event);

    if (window.fbq && product.pixels?.metaPixelId) {
      window.fbq("track", "ViewContent", event);
    }

    if (window.ttq && product.pixels?.tiktokPixelId) {
      window.ttq.track("ViewContent", event);
    }
  }, [product]);

  useEffect(() => {
    const reached = new Set();
    const thresholds = [25, 50, 75, 100];

    function trackScrollDepth() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      for (const depth of thresholds) {
        if (percent >= depth && !reached.has(depth)) {
          reached.add(depth);
          trackEvent("scroll_depth", {
            productId: product.id,
            productSlug: product.slug,
            payload: { depth }
          });
        }
      }
    }

    function trackAnnotatedClick(event) {
      const target = event.target.closest?.("[data-analytics-event]");
      if (!target) return;
      trackEvent(target.dataset.analyticsEvent, {
        productId: product.id,
        productSlug: product.slug,
        payload: {
          label: target.dataset.analyticsLabel || target.textContent?.trim() || "",
          placement: target.dataset.analyticsPlacement || ""
        }
      });
    }

    document.addEventListener("click", trackAnnotatedClick);
    window.addEventListener("scroll", trackScrollDepth, { passive: true });
    window.addEventListener("resize", trackScrollDepth);
    trackScrollDepth();

    return () => {
      document.removeEventListener("click", trackAnnotatedClick);
      window.removeEventListener("scroll", trackScrollDepth);
      window.removeEventListener("resize", trackScrollDepth);
    };
  }, [product]);

  return null;
}
