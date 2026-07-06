import { notFound } from "next/navigation";
import ColorBearLanding from "@/components/ColorBearLanding";
import CheckoutForm from "@/components/CheckoutForm";
import PixelTrackers from "@/components/PixelTrackers";
import PublicHeader from "@/components/PublicHeader";
import { assetList, assetUrl } from "@/lib/assets";
import { formatIdr, getProductBySlug } from "@/lib/store";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product?.title || "商品落地页",
    description: product?.subtitle || "单品落地页。"
  };
}

export default async function ProductPage({ params, searchParams }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const canPreview = query?.preview === product.previewToken;
  if (product.status !== "published" && !canPreview) notFound();
  if (product.status === "archived") notFound();

  const heroImage = assetUrl(product.heroImage);
  const videoUrl = assetUrl(product.videoUrl);
  const videoPoster = assetUrl(product.videoPoster || product.heroImage || "");
  const gallery = assetList(product.gallery || []);
  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl);

  if (product.slug === "colorbear-art") {
    return (
      <>
        <PixelTrackers product={product} />
        <ColorBearLanding product={product} />
      </>
    );
  }

  return (
    <main className="public-page">
      <PublicHeader />
      <PixelTrackers product={product} />
      <article className="public-product">
        <section className="hero-media">
          {heroImage ? <img alt={product.title} src={heroImage} /> : null}
        </section>
        <section className="product-copy">
          <h1>{product.title}</h1>
          {product.subtitle ? <p className="muted">{product.subtitle}</p> : null}
          <div className="price-line">
            <span className="price">{formatIdr(product.price)}</span>
            {product.compareAtPrice ? <span className="compare">{formatIdr(product.compareAtPrice)}</span> : null}
          </div>
          {videoUrl ? (
            <a className="btn secondary" href="#demo-video">
              观看使用演示
            </a>
          ) : null}
        </section>

        {videoUrl ? (
          <section className="section" id="demo-video">
            <h2>产品使用演示</h2>
            <div className="demo-video">
              {youtubeEmbedUrl ? (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  src={youtubeEmbedUrl}
                  title={`${product.title} 使用演示`}
                />
              ) : (
                <video controls playsInline poster={videoPoster} src={videoUrl} />
              )}
            </div>
          </section>
        ) : null}

        {product.benefits?.length ? (
          <section className="section">
            <h2>产品卖点</h2>
            <ul className="bullet-list">
              {product.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {gallery.length ? (
          <section className="section">
            <h2>产品详情</h2>
            <div className="gallery">
              {gallery.map((image) => (
                <img alt={`${product.title} 详情图`} key={image} src={image} />
              ))}
            </div>
          </section>
        ) : null}

        {product.sections?.map((section) => (
          <section className="section" key={`${section.heading}-${section.body}`}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        {product.reviews?.length ? (
          <section className="section">
            <h2>用户评价</h2>
            <div className="grid">
              {product.reviews.map((review) => (
                <div className="card" key={`${review.name}-${review.text}`}>
                  <strong>{review.name}</strong>
                  <p className="muted">{"★".repeat(review.rating)}</p>
                  <p>{review.text}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {product.faqs?.length ? (
          <section className="section">
            <h2>常见问题</h2>
            <div className="grid">
              {product.faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <CheckoutForm product={product} />
      </article>
    </main>
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
    return `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0`;
  } catch {
    return "";
  }
}
