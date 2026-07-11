"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DeleteProductButton from "@/components/DeleteProductButton";
import { formatIdr } from "@/lib/format";
import { statusLabel } from "@/lib/adminLabels";
import { useAdminLanguage } from "@/components/AdminLanguageProvider";
import { adminDateLocale } from "@/lib/adminI18n";

export default function LandingPagesList({ products }) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const { locale, t } = useAdminLanguage();

  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return products.filter((product) => {
      const matchesStatus = status === "all" || product.status === status;
      const haystack = `${product.title} ${product.slug}`.toLowerCase();
      const matchesKeyword = !query || haystack.includes(query);
      return matchesStatus && matchesKeyword;
    });
  }, [keyword, products, status]);

  const counts = useMemo(
    () => ({
      all: products.length,
      published: products.filter((product) => product.status === "published").length,
      draft: products.filter((product) => product.status === "draft").length,
      archived: products.filter((product) => product.status === "archived").length
    }),
    [products]
  );

  return (
    <div className="grid">
      <div className="page-head">
        <div>
          <h2>{t("落地页管理")}</h2>
          <p className="muted">{t("管理所有互不关联的单品落地页，快速搜索、筛选、预览和编辑。")}</p>
        </div>
        <Link className="btn" href="/admin/products/new">
          {t("新增落地页")}
        </Link>
      </div>

      <section className="stats-grid">
        <Metric label={t("全部")} value={counts.all} />
        <Metric label={t("已发布")} value={counts.published} />
        <Metric label={t("草稿")} value={counts.draft} />
        <Metric label={t("已下架")} value={counts.archived} />
      </section>

      <section className="card">
        <div className="list-toolbar admin-filter-panel">
          <div className="field">
            <label htmlFor="landing-search">{t("搜索标题或路径")}</label>
            <input
              id="landing-search"
              placeholder={t("例如 shaper-fit")}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="landing-status">{t("状态筛选")}</label>
            <select id="landing-status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">{t("全部状态")}</option>
              <option value="published">{t("已发布")}</option>
              <option value="draft">{t("草稿")}</option>
              <option value="archived">{t("已下架")}</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          {filtered.length ? (
            <table className="landing-table">
              <thead>
                <tr>
                  <th>{t("落地页")}</th><th>{t("状态")}</th><th>{t("价格")}</th><th>{t("支付")}</th><th>{t("更新时间")}</th><th>{t("操作")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.title}</strong>
                      <div className="muted">/p/{product.slug}</div>
                    </td>
                    <td>
                      <span className={`pill ${product.status}`}>{statusLabel(product.status, locale)}</span>
                    </td>
                    <td>{formatIdr(product.price)}</td>
                    <td>
                      <div className="muted">{paymentSummary(product, locale)}</div>
                    </td>
                    <td>{new Date(product.updatedAt).toLocaleString(adminDateLocale(locale))}</td>
                    <td>
                      <div className="row-actions">
                        <Link className="btn secondary small" href={`/admin/products/${product.id}`}>
                          {t("编辑")}
                        </Link>
                        {product.status === "published" ? (
                          <Link className="btn secondary small" href={`/p/${product.slug}`} target="_blank">
                            {t("访问")}
                          </Link>
                        ) : (
                          <Link className="btn secondary small" href={`/p/${product.slug}?preview=${product.previewToken}`} target="_blank">
                            {t("预览")}
                          </Link>
                        )}
                        <DeleteProductButton product={{ id: product.id, title: product.title, slug: product.slug }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">{t("没有符合条件的落地页。")}</div>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="card">
      <p className="muted">{label}</p>
      <h3>{value}</h3>
    </div>
  );
}

function paymentSummary(product, locale) {
  const methods = product.paymentMethods || [];
  const onlineCount = methods.filter((method) => method !== "cod").length;
  const cod = product.codEnabled && methods.includes("cod") ? `${locale === "id" ? ", " : "，"}COD` : "";
  return locale === "id" ? `${onlineCount} pembayaran online${cod}` : `${onlineCount}种在线支付${cod}`;
}
