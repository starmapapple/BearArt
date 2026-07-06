import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import { assetUrl } from "@/lib/assets";
import { formatIdr, getProducts } from "@/lib/store";

export const metadata = {
  title: "全部商品",
  description: "查看当前已发布的商品落地页。"
};

export default async function ProductsPage() {
  const products = (await getProducts()).filter((product) => product.status === "published");

  return (
    <main className="public-page with-nav">
      <PublicHeader />
      <section className="site-section">
        <div className="page-head">
          <div>
            <h1>全部商品</h1>
            <p className="muted">每个商品都有独立购买页，进入后可直接下单。</p>
          </div>
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
