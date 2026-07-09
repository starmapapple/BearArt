export const colorBearGalleryFallback = [
  "/uploads/colorbear-art/gallery-1.png",
  "/uploads/colorbear-art/gallery-2.png",
  "/uploads/colorbear-art/gallery-3.png",
  "/uploads/colorbear-art/gallery-4.png"
];

export const colorBearReviewGalleryFallback = {
  Ayu: [
    "/uploads/colorbear-art-reviews/gallery/ayu-work-1.jpeg",
    "/uploads/colorbear-art-reviews/gallery/ayu-work-2.jpeg",
    "/uploads/colorbear-art-reviews/gallery/ayu-work-3.jpeg",
    "/uploads/colorbear-art-reviews/gallery/ayu-work-4.jpeg",
    "/uploads/colorbear-art-reviews/gallery/ayu-work-5.jpeg"
  ],
  Dina: [
    "/uploads/colorbear-art-reviews/gallery/dina-work-1.jpeg",
    "/uploads/colorbear-art-reviews/gallery/dina-work-2.jpeg",
    "/uploads/colorbear-art-reviews/gallery/dina-work-3.jpeg",
    "/uploads/colorbear-art-reviews/gallery/dina-work-4.jpeg",
    "/uploads/colorbear-art-reviews/gallery/dina-work-5.jpeg"
  ]
};

export function applyColorBearDefaults(product) {
  if (product?.slug !== "colorbear-art") return product;

  return {
    ...product,
    reviews: (product.reviews || []).map((review) => ({
      ...review,
      gallery: review.gallery?.length ? review.gallery : colorBearReviewGalleryFallback[review.name] || []
    }))
  };
}
