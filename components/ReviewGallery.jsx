"use client";

import { useState } from "react";

export default function ReviewGallery({ images = [], name = "Review" }) {
  const slides = images.filter(Boolean).slice(0, 5);
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
      <div className="review-gallery" aria-label={`Karya anak dari ${name}`}>
        {slides.map((src, index) => (
          <button
            aria-label={`Lihat foto karya ${index + 1} dari ${name}`}
            className="review-gallery-thumb"
            key={src}
            type="button"
            onClick={() => {
              setActive(index);
              setOpen(true);
            }}
          >
            <img alt={`Karya anak ${name} ${index + 1}`} loading="lazy" src={src} />
          </button>
        ))}
      </div>

      {open ? (
        <div className="gift-lightbox review-lightbox" role="dialog" aria-modal="true" aria-label={`Preview karya ${name}`}>
          <button className="gift-lightbox-close" type="button" aria-label="Tutup preview" onClick={() => setOpen(false)}>
            ×
          </button>
          {slides.length > 1 ? (
            <button className="gift-lightbox-arrow left" type="button" aria-label="Foto sebelumnya" onClick={() => move(-1)}>
              ‹
            </button>
          ) : null}
          <div
            className="gift-lightbox-panel review-lightbox-panel"
            onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX || 0)}
            onTouchEnd={handleTouchEnd}
          >
            <img alt={`Karya anak ${name} besar ${active + 1}`} src={slides[active]} />
            <span className="review-lightbox-count">
              {active + 1}/{slides.length}
            </span>
          </div>
          {slides.length > 1 ? (
            <button className="gift-lightbox-arrow right" type="button" aria-label="Foto berikutnya" onClick={() => move(1)}>
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
