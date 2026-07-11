import PublicFooter from "@/components/PublicFooter";
import PublicHeader from "@/components/PublicHeader";

export default function PolicyPage({ eyebrow, title, intro, children }) {
  return (
    <main className="public-page policy-page">
      <PublicHeader locale="id" mode="product-only" />
      <article className="policy-shell">
        <header className="policy-head">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <small>Terakhir diperbarui: 11 Juli 2026</small>
        </header>
        <div className="policy-content">{children}</div>
        <PublicFooter />
      </article>
    </main>
  );
}
