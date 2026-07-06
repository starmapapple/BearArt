"use client";

import { useState } from "react";
import { formatIdr } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/paymentMethods";
import { statusLabel } from "@/lib/adminLabels";

export default function OrderLookup({ locale = "zh" }) {
  const isId = locale === "id";
  const labels = isId
    ? {
        required: "Masukkan nomor pesanan atau nomor WhatsApp.",
        failed: "Pencarian gagal, silakan coba lagi.",
        empty: "Pesanan tidak ditemukan. Periksa nomor pesanan atau nomor WhatsApp.",
        field: "Nomor Pesanan atau Nomor WhatsApp",
        placeholder: "Contoh ord_xxx atau 08123456789",
        loading: "Mencari...",
        submit: "Cari Pesanan",
        detail: "Lihat Detail"
      }
    : {
        required: "请输入订单号或 WhatsApp 手机号。",
        failed: "查询失败，请稍后重试。",
        empty: "没有找到匹配订单，请确认订单号或手机号。",
        field: "订单号或 WhatsApp 手机号",
        placeholder: "例如 ord_xxx 或 08123456789",
        loading: "查询中...",
        submit: "查询订单",
        detail: "查看详情"
      };
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(event) {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      setMessage(labels.required);
      setOrders([]);
      return;
    }

    setLoading(true);
    setMessage("");
    const searchParams = value.startsWith("ord_") ? `orderId=${encodeURIComponent(value)}` : `phone=${encodeURIComponent(value)}`;
    const response = await fetch(`/api/account/orders?${searchParams}`);
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error || labels.failed);
      setOrders([]);
      return;
    }

    setOrders(payload.orders || []);
    setMessage(payload.orders?.length ? "" : labels.empty);
  }

  return (
    <section className="card account-panel">
      <form className="lookup-form" onSubmit={search}>
        <div className="field">
          <label htmlFor="order-query">{labels.field}</label>
          <input
            id="order-query"
            placeholder={labels.placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <button className="btn" disabled={loading} type="submit">
          {loading ? labels.loading : labels.submit}
        </button>
      </form>

      {message ? <p className="muted">{message}</p> : null}

      {orders.length ? (
        <div className="order-results">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div>
                <strong>{order.productTitle}</strong>
                <div className="muted">
                  {order.variant} · x{order.quantity} · {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                </div>
                <div className="muted">{order.id}</div>
              </div>
              <div className="order-card-side">
                <span className={`pill ${order.status}`}>{statusLabel(order.status)}</span>
                <strong>{formatIdr(order.total)}</strong>
                <a className="btn secondary small" href={`/account/orders/${order.id}`}>
                  {labels.detail}
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
