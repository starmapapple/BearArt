import PaymentSuccessTracker from "@/components/PaymentSuccessTracker";
import { getOrderById } from "@/lib/store";

export default async function SuccessPage({ searchParams }) {
  const query = await searchParams;
  const orderId = query?.orderId || "";
  const order = orderId ? await getOrderById(orderId) : null;

  return (
    <main className="status-page">
      {order ? (
        <PaymentSuccessTracker
          order={{
            id: order.id,
            productId: order.productId,
            productSlug: order.productSlug,
            productTitle: order.productTitle,
            paymentMethod: order.paymentMethod,
            total: order.total,
            currency: order.currency,
            city: order.customer?.city,
            province: order.customer?.province
          }}
        />
      ) : null}
      <section className="card status-card">
        <span className="pill paid">已支付</span>
        <h1>支付成功</h1>
        <p className="muted">订单 {orderId} 已通过支付回调确认收款。</p>
        <a className="btn secondary" href={`/account/orders/${orderId}`}>
          查看订单详情
        </a>
      </section>
    </main>
  );
}
