import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import { assetUrl } from "@/lib/assets";
import { formatIdr, getProducts } from "@/lib/store";

export default async function HomePage() {
  const products = (await getProducts()).filter((product) => product.status === "published").slice(0, 3);

  return (
    <main className="public-page with-nav">
      <PublicHeader />
      <section className="site-hero">
        <h1>Nusantara Shop</h1>
        <p>面向印尼用户的轻量独立站。你可以浏览商品、直接购买，并在个人中心追踪订单状态。</p>
        <div className="hero-actions">
          <Link className="btn" href="/products">
            浏览商品
          </Link>
          <Link className="btn secondary" href="/account">
            查询订单
          </Link>
        </div>
      </section>
      <section className="site-section">
        <div className="page-head">
          <div>
            <h2>推荐商品</h2>
            <p className="muted">点击商品进入独立购买页。</p>
          </div>
          <Link className="btn secondary" href="/products">
            查看全部
          </Link>
        </div>
        <div className="product-grid-public">
          {products.map((product) => (
            <Link className="public-product-card" href={`/p/${product.slug}`} key={product.id}>
              {product.heroImage ? <img alt={product.title} src={assetUrl(product.heroImage)} /> : null}
              <div>
                <strong>{product.title}</strong>
                <p className="muted">{product.subtitle}</p>
                <span>{formatIdr(product.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
