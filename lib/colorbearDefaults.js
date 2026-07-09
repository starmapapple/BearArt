export const colorBearGalleryFallback = [
  "/uploads/colorbear-art/gallery-1-small.webp",
  "/uploads/colorbear-art/gallery-2-small.webp",
  "/uploads/colorbear-art/gallery-3-small.webp",
  "/uploads/colorbear-art/gallery-4-small.webp"
];

export const colorBearGiftFallback = [
  "/uploads/colorbear-art-bonus/dress-kids-a-1-small.webp",
  "/uploads/colorbear-art-bonus/dress-kids-a-2-small.webp",
  "/uploads/colorbear-art-bonus/dress-kids-b-1-small.webp",
  "/uploads/colorbear-art-bonus/dress-kids-b-2-small.webp"
];

export const colorBearReviewGalleryFallback = {
  Ayu: [
    "/uploads/colorbear-art-reviews-gallery/ayu-work-1-small.webp",
    "/uploads/colorbear-art-reviews-gallery/ayu-work-2-small.webp",
    "/uploads/colorbear-art-reviews-gallery/ayu-work-3-small.webp",
    "/uploads/colorbear-art-reviews-gallery/ayu-work-4-small.webp",
    "/uploads/colorbear-art-reviews-gallery/ayu-work-5-small.webp"
  ],
  Dina: [
    "/uploads/colorbear-art-reviews-gallery/dina-work-1-small.webp",
    "/uploads/colorbear-art-reviews-gallery/dina-work-2-small.webp",
    "/uploads/colorbear-art-reviews-gallery/dina-work-3-small.webp",
    "/uploads/colorbear-art-reviews-gallery/dina-work-4-small.webp",
    "/uploads/colorbear-art-reviews-gallery/dina-work-5-small.webp"
  ]
};

const legacyAssetMap = {
  "/uploads/colorbear-art/hero-offer-kit.png": "/uploads/colorbear-art/hero-offer-kit-small.webp",
  "/uploads/colorbear-art/disney-dress-gift.png": colorBearGiftFallback[0],
  "/uploads/colorbear-art/hero.png": "/uploads/colorbear-art/hero-small.webp",
  "/uploads/colorbear-art/usage-guide.png": "/uploads/colorbear-art/usage-guide-small.webp",
  "/uploads/colorbear-art/gallery-1.png": "/uploads/colorbear-art/gallery-1-small.webp",
  "/uploads/colorbear-art/gallery-2.png": "/uploads/colorbear-art/gallery-2-small.webp",
  "/uploads/colorbear-art/gallery-3.png": "/uploads/colorbear-art/gallery-3-small.webp",
  "/uploads/colorbear-art/gallery-4.png": "/uploads/colorbear-art/gallery-4-small.webp",
  "/uploads/colorbear-art/gallery-5.png": "/uploads/colorbear-art/gallery-5-small.webp",
  "/uploads/colorbear-art/gallery-6.png": "/uploads/colorbear-art/gallery-6-small.webp",
  "/uploads/colorbear-art/reviews/ayu.png": "/uploads/colorbear-art-reviews/ayu-balanced.webp",
  "/uploads/colorbear-art/reviews/dina.png": "/uploads/colorbear-art-reviews/dina-balanced.webp",
  "/uploads/colorbear-art-reviews/gallery/ayu-work-1.jpeg": "/uploads/colorbear-art-reviews-gallery/ayu-work-1-small.webp",
  "/uploads/colorbear-art-reviews/gallery/ayu-work-2.jpeg": "/uploads/colorbear-art-reviews-gallery/ayu-work-2-small.webp",
  "/uploads/colorbear-art-reviews/gallery/ayu-work-3.jpeg": "/uploads/colorbear-art-reviews-gallery/ayu-work-3-small.webp",
  "/uploads/colorbear-art-reviews/gallery/ayu-work-4.jpeg": "/uploads/colorbear-art-reviews-gallery/ayu-work-4-small.webp",
  "/uploads/colorbear-art-reviews/gallery/ayu-work-5.jpeg": "/uploads/colorbear-art-reviews-gallery/ayu-work-5-small.webp",
  "/uploads/colorbear-art-reviews/gallery/dina-work-1.jpeg": "/uploads/colorbear-art-reviews-gallery/dina-work-1-small.webp",
  "/uploads/colorbear-art-reviews/gallery/dina-work-2.jpeg": "/uploads/colorbear-art-reviews-gallery/dina-work-2-small.webp",
  "/uploads/colorbear-art-reviews/gallery/dina-work-3.jpeg": "/uploads/colorbear-art-reviews-gallery/dina-work-3-small.webp",
  "/uploads/colorbear-art-reviews/gallery/dina-work-4.jpeg": "/uploads/colorbear-art-reviews-gallery/dina-work-4-small.webp",
  "/uploads/colorbear-art-reviews/gallery/dina-work-5.jpeg": "/uploads/colorbear-art-reviews-gallery/dina-work-5-small.webp"
};

export function applyColorBearDefaults(product) {
  if (product?.slug !== "colorbear-art") return product;

  const normalizedGiftImages = replaceLegacyAssetList(product.giftImages);
  const giftImages =
    normalizedGiftImages.length === 1 && normalizedGiftImages[0] === colorBearGiftFallback[0]
      ? colorBearGiftFallback
      : normalizedGiftImages.length
        ? normalizedGiftImages
        : colorBearGiftFallback;

  return {
    ...product,
    heroImage: replaceLegacyAsset(product.heroImage || "/uploads/colorbear-art/hero-offer-kit-small.webp"),
    videoPoster: replaceLegacyAsset(product.videoPoster || "/uploads/colorbear-art/hero-offer-kit-small.webp"),
    problemImage: replaceLegacyAsset(product.problemImage || "/uploads/colorbear-art/hero-small.webp"),
    usageGuideImage: replaceLegacyAsset(product.usageGuideImage || "/uploads/colorbear-art/usage-guide-small.webp"),
    giftImages,
    gallery: replaceLegacyAssetList(product.gallery).length
      ? replaceLegacyAssetList(product.gallery)
      : colorBearGalleryFallback,
    reviews: (product.reviews || []).map((review) => ({
      ...review,
      avatar: replaceLegacyAsset(review.avatar),
      gallery: replaceLegacyAssetList(review.gallery).length
        ? replaceLegacyAssetList(review.gallery)
        : colorBearReviewGalleryFallback[review.name] || []
    }))
  };
}

function replaceLegacyAsset(value) {
  if (!value) return value;
  return legacyAssetMap[value] || value;
}

function replaceLegacyAssetList(values) {
  return Array.isArray(values) ? values.filter(Boolean).map(replaceLegacyAsset) : [];
}
