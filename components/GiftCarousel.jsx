"use client";

import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analyticsClient";
import { assetList } from "@/lib/assets";

export default function GiftCarousel({ images = [], alt = "Bonus gift", title = "", description = "", compact = false, product }) {
  const slides = useMemo(() => assetList(images), [images]);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  if (!slides.length) return null;

  function move(direction) {
    setActive((current) => (current + direction + slides.length) % slides.length);
  }

  function handleTouchEnd(event) {
    if (touchStart === null) return;
    const endX = event.changedTouches[0]?.clientX || touchStart;
    const delta = endX - touchStart;
    setTouchStart(null);

    if (Math.abs(delta) < 34 || slides.length < 2) return;
    move(delta < 0 ? 1 : -1);
  }

  return (
    <>
      <div className={compact ? "gift-carousel is-compact" : "gift-carousel"} onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX || 0)} onTouchEnd={handleTouchEnd}>
        <button
          className="gift-carousel-main"
          type="button"
          onClick={() => {
            setOpen(true);
            trackEvent("gift_click", {
              productId: product?.id,
              productSlug: product?.slug,
              payload: { active: active + 1, compact }
            });
          }}
        >
          <img alt={`${alt} ${active + 1}`} src={slides[active]} />
          <span>{compact ? "Lihat detail" : "Klik untuk lihat besar"}</span>
        </button>
        {!compact && slides.length > 1 ? (
          <div className="gift-carousel-controls">
            <button aria-label="Gambar sebelumnya" type="button" onClick={() => move(-1)}>
              ‹
            </button>
            <span>
              {active + 1}/{slides.length}
            </span>
            <button aria-label="Gambar berikutnya" type="button" onClick={() => move(1)}>
              ›
            </button>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="gift-lightbox" role="dialog" aria-modal="true" aria-label="Preview bonus gift">
          <button className="gift-lightbox-close" type="button" aria-label="Tutup preview" onClick={() => setOpen(false)}>
            ×
          </button>
          {slides.length > 1 ? (
            <button className="gift-lightbox-arrow left" type="button" aria-label="Gambar sebelumnya" onClick={() => move(-1)}>
              ‹
            </button>
          ) : null}
          <div className="gift-lightbox-panel">
            <img alt={`${alt} besar ${active + 1}`} src={slides[active]} />
            {title || description ? (
              <div className="gift-lightbox-copy">
                {title ? <strong>{title}</strong> : null}
                {description ? <p>{description}</p> : null}
              </div>
            ) : null}
          </div>
          {slides.length > 1 ? (
            <button className="gift-lightbox-arrow right" type="button" aria-label="Gambar berikutnya" onClick={() => move(1)}>
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
