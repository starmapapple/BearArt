"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import CountdownTimer from "@/components/CountdownTimer";
import { trackEvent } from "@/lib/analyticsClient";

export default function StickyPromoBar({ price, compareAtPrice, ctaText = "Pesan Sekarang", product }) {
  const staticBarRef = useRef(null);
  const [fixedVisible, setFixedVisible] = useState(false);
  const [staticVisible, setStaticVisible] = useState(false);
  const fixedImpressionRef = useRef(false);
  const staticImpressionRef = useRef(false);

  useEffect(() => {
    function updateVisibility() {
      setFixedVisible(window.scrollY > window.innerHeight * 1.55);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    const observer = staticBarRef.current
      ? new IntersectionObserver(
          ([entry]) => {
            setStaticVisible(entry.isIntersecting);
          },
          { rootMargin: "0px 0px -12px 0px", threshold: 0.15 }
        )
      : null;

    if (staticBarRef.current && observer) observer.observe(staticBarRef.current);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (fixedVisible && !fixedImpressionRef.current) {
      fixedImpressionRef.current = true;
      trackEvent("sticky_bar_impression", {
        productId: product?.id,
        productSlug: product?.slug,
        payload: { placement: "fixed" }
      });
    }
    if (staticVisible && !staticImpressionRef.current) {
      staticImpressionRef.current = true;
      trackEvent("sticky_bar_impression", {
        productId: product?.id,
        productSlug: product?.slug,
        payload: { placement: "static" }
      });
    }
  }, [fixedVisible, staticVisible, product]);

  return (
    <>
      {fixedVisible && !staticVisible ? (
        <PromoBarContent className="sticky-promo-bar is-fixed" price={price} compareAtPrice={compareAtPrice} ctaText={ctaText} product={product} placement="fixed" />
      ) : null}
      <PromoBarContent ref={staticBarRef} className="sticky-promo-bar is-static" price={price} compareAtPrice={compareAtPrice} ctaText={ctaText} product={product} placement="static" />
    </>
  );
}

const PromoBarContent = forwardRef(function PromoBarContent({ className, price, compareAtPrice, ctaText, product, placement }, ref) {
  return (
    <aside className={className} ref={ref} aria-label="Promo terbatas">
      <div className="sticky-promo-top">
        <div className="sticky-promo-timer">
          <b>Diskon 50%</b>
        </div>
        <div className="sticky-promo-countdown">
          <CountdownTimer storageKey="colorbear-60-minute-promo" label="Sisa promo" compact />
        </div>
      </div>
      <div className="sticky-promo-bottom">
        <div className="sticky-promo-price">
          <strong>{price}</strong>
          {compareAtPrice ? <small>{compareAtPrice}</small> : null}
        </div>
        <a
          className="sticky-promo-button"
          href="#checkout"
          onClick={() =>
            trackEvent("sticky_cta_click", {
              productId: product?.id,
              productSlug: product?.slug,
              payload: { placement }
            })
          }
        >
          {ctaText}
        </a>
      </div>
    </aside>
  );
});
