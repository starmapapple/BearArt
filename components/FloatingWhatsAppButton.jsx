"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analyticsClient";
import { assetUrl } from "@/lib/assets";

const DEFAULT_TOP_RATIO = 0.56;
const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "6285215448518";
const STORAGE_KEY = "colorbear-floating-wa-top";

export default function FloatingWhatsAppButton() {
  const [top, setTop] = useState(null);
  const dragState = useRef({ dragging: false, moved: false, offsetY: 0 });
  const whatsappUrl = useMemo(() => {
    const message = "Halo Beart Art Shop, saya ingin bertanya tentang pesanan ColorBear Art.";
    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
  }, []);

  useEffect(() => {
    const savedTop = Number(window.localStorage.getItem(STORAGE_KEY));
    const nextTop = Number.isFinite(savedTop) && savedTop > 0 ? savedTop : window.innerHeight * DEFAULT_TOP_RATIO;
    setTop(clampTop(nextTop));

    function handleResize() {
      setTop((current) => clampTop(current || window.innerHeight * DEFAULT_TOP_RATIO));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handlePointerDown(event) {
    dragState.current = {
      dragging: true,
      moved: false,
      offsetY: event.clientY - (top || window.innerHeight * DEFAULT_TOP_RATIO)
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragState.current.dragging) return;
    const nextTop = clampTop(event.clientY - dragState.current.offsetY);
    if (Math.abs(nextTop - (top || 0)) > 2) {
      dragState.current.moved = true;
    }
    setTop(nextTop);
  }

  function handlePointerUp(event) {
    const wasMoved = dragState.current.moved;
    dragState.current.dragging = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (top) {
      window.localStorage.setItem(STORAGE_KEY, String(top));
    }
    if (!wasMoved) {
      trackEvent("wa_click", {
        productSlug: window.location.pathname.split("/").pop() || "",
        payload: { placement: "floating_button" }
      });
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <button
      aria-label="联系客服 WhatsApp"
      className="floating-wa-button"
      style={{ top: top ? `${top}px` : "56vh" }}
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img alt="" src={assetUrl("/icons/whatsapp-green.webp")} />
      <span>CS</span>
    </button>
  );
}

function clampTop(value) {
  if (typeof window === "undefined") return value;
  const minTop = 96;
  const maxTop = Math.max(minTop, window.innerHeight - 168);
  return Math.min(Math.max(value, minTop), maxTop);
}
