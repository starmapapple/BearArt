"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatIdr } from "@/lib/format";
import { statusLabel } from "@/lib/adminLabels";

export default function LandingPagesList({ products }) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");

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
          <h2>落地页管理</h2>
          <p className="muted">管理所有互不关联的单品落地页，快速搜索、筛选、预览和编辑。</p>
        </div>
        <Link className="btn" href="/admin/products/new">
          新增落地页
        </Link>
      </div>

      <section className="stats-grid">
        <Metric label="全部" value={counts.all} />
        <Metric label="已发布" value={counts.published} />
        <Metric label="草稿" value={counts.draft} />
        <Metric label="已下架" value={counts.archived} />
      </section>

      <section className="card">
        <div className="list-toolbar admin-filter-panel">
          <div className="field">
            <label htmlFor="landing-search">搜索标题或路径</label>
            <input
              id="landing-search"
              placeholder="例如 shaper-fit"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="landing-status">状态筛选</label>
            <select id="landing-status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">全部状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
              <option value="archived">已下架</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          {filtered.length ? (
            <table className="landing-table">
              <thead>
                <tr>
                  <th>落地页</th>
                  <th>状态</th>
                  <th>价格</th>
                  <th>支付</th>
                  <th>更新时间</th>
                  <th>操作</th>
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
                      <span className={`pill ${product.status}`}>{statusLabel(product.status)}</span>
                    </td>
                    <td>{formatIdr(product.price)}</td>
                    <td>
                      <div className="muted">{paymentSummary(product)}</div>
                    </td>
                    <td>{new Date(product.updatedAt).toLocaleString("zh-CN")}</td>
                    <td>
                      <div className="row-actions">
                        <Link className="btn secondary small" href={`/admin/products/${product.id}`}>
                          编辑
                        </Link>
                        {product.status === "published" ? (
                          <Link className="btn secondary small" href={`/p/${product.slug}`} target="_blank">
                            访问
                          </Link>
                        ) : (
                          <Link className="btn secondary small" href={`/p/${product.slug}?preview=${product.previewToken}`} target="_blank">
                            预览
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">没有符合条件的落地页。</div>
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

function paymentSummary(product) {
  const methods = product.paymentMethods || [];
  const onlineCount = methods.filter((method) => method !== "cod").length;
  const cod = product.codEnabled && methods.includes("cod") ? "，COD" : "";
  return `${onlineCount}种在线支付${cod}`;
}
