import { notFound } from "next/navigation";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import { statusLabel } from "@/lib/adminLabels";
import { PAYMENT_METHOD_LABELS } from "@/lib/paymentMethods";
import { formatIdr, getOrderById } from "@/lib/store";

export default async function AccountOrderDetailPage({ params }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <main className="public-page with-nav">
      <PublicHeader locale="id" mode="product-only" />
      <section className="site-section narrow">
        <div className="page-head">
          <div>
            <h1>订单详情</h1>
            <p className="muted">{order.id}</p>
          </div>
          <Link className="btn secondary" href="/account">
            返回个人中心
          </Link>
        </div>
        <div className="card order-detail">
          <div className="order-detail-head">
            <div>
              <strong>{order.productTitle}</strong>
              <p className="muted">
                {order.variant} · x{order.quantity}
              </p>
            </div>
            <span className={`pill ${order.status}`}>{statusLabel(order.status)}</span>
          </div>
          <dl className="detail-list">
            <div>
              <dt>订单金额</dt>
              <dd>{formatIdr(order.total)}</dd>
            </div>
            <div>
              <dt>支付方式</dt>
              <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</dd>
            </div>
            <div>
              <dt>收货人</dt>
              <dd>{order.customer?.name}</dd>
            </div>
            <div>
              <dt>联系电话</dt>
              <dd>{order.customer?.phone}</dd>
            </div>
            <div>
              <dt>收货地址</dt>
              <dd>
                {order.customer?.province} {order.customer?.city} {order.customer?.address}
              </dd>
            </div>
            {order.customer?.postalCode ? (
              <div>
                <dt>邮政编码</dt>
                <dd>{order.customer.postalCode}</dd>
              </div>
            ) : null}
            {order.location?.lat && order.location?.lon ? (
              <div>
                <dt>定位信息</dt>
                <dd>
                  {order.location.lat.toFixed(5)}, {order.location.lon.toFixed(5)}
                </dd>
              </div>
            ) : null}
            <div>
              <dt>创建时间</dt>
              <dd>{new Date(order.createdAt).toLocaleString("zh-CN")}</dd>
            </div>
          </dl>
          <div className="timeline">
            {(order.events || []).map((event) => (
              <div className="timeline-item" key={`${event.at}-${event.note}`}>
                <span />
                <div>
                  <strong>{statusLabel(event.note) || event.note}</strong>
                  <p className="muted">{new Date(event.at).toLocaleString("zh-CN")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
