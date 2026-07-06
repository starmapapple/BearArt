"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analyticsClient";
import { assetUrl } from "@/lib/assets";

export default function DemoVideoModal({ videoUrl, poster, title, product }) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef(null);
  const playedRef = useRef(false);
  const resolvedVideoUrl = assetUrl(videoUrl);
  const resolvedPoster = assetUrl(poster);
  const youtubeEmbedUrl = getYouTubeEmbedUrl(resolvedVideoUrl);

  useEffect(() => {
    function openDemo(event) {
      const target = event.target.closest?.("[data-open-demo-video]");
      if (!target) return;
      event.preventDefault();
      setOpen(true);
      playedRef.current = false;
      trackEvent("video_open", {
        productId: product?.id,
        productSlug: product?.slug,
        payload: { title }
      });
    }

    function closeWithEscape(event) {
      if (event.key === "Escape") closeDemo();
    }

    document.addEventListener("click", openDemo);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("click", openDemo);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function closeDemo() {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setOpen(false);
  }

  return (
    <>
      <section className="colorbear-band colorbear-video-block" id="demo-video">
        <div className="colorbear-section-head">
          <span className="colorbear-kicker">Product demo</span>
          <h2>Lihat cara anak mengikuti aktivitas kreatifnya</h2>
        </div>
        <button className="colorbear-video-trigger" type="button" data-open-demo-video>
          <img alt={`${title} demo video`} src={resolvedPoster} />
          <span className="video-play-button" aria-hidden="true">
            ▶
          </span>
          <strong>Lihat Demo Produk</strong>
        </button>
      </section>

      {open ? (
        <div className="video-modal" role="dialog" aria-modal="true" aria-label="Product demo video">
          <button className="video-modal-backdrop" type="button" aria-label="Tutup video" onClick={closeDemo} />
          <div className="video-modal-panel">
            <button className="video-modal-close" type="button" aria-label="Tutup video" onClick={closeDemo}>
              ×
            </button>
            {youtubeEmbedUrl ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                src={youtubeEmbedUrl}
                title={`${title} demo video`}
                onLoad={() => {
                  if (playedRef.current) return;
                  playedRef.current = true;
                  trackEvent("video_play", {
                    productId: product?.id,
                    productSlug: product?.slug,
                    payload: { title, provider: "youtube" }
                  });
                }}
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                controls
                playsInline
                poster={resolvedPoster}
                src={resolvedVideoUrl}
                onPlay={() => {
                  if (playedRef.current) return;
                  playedRef.current = true;
                  trackEvent("video_play", {
                    productId: product?.id,
                    productSlug: product?.slug,
                    payload: { title, provider: "self_hosted" }
                  });
                }}
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== "string") return "";

  try {
    const parsed = new URL(url);
    let videoId = "";

    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.replace("/", "");
    } else if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/embed/")[1]?.split("/")[0] || "";
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      } else {
        videoId = parsed.searchParams.get("v") || "";
      }
    }

    if (!videoId) return "";
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;
  } catch {
    return "";
  }
}
