import { notFound } from "next/navigation";
import Link from "next/link";
import { formatIdr, getOrderById } from "@/lib/store";

export default async function MockCheckoutPage({ params }) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) notFound();

  return (
    <main className="status-page">
      <section className="card status-card">
        <span className={`pill ${order.status}`}>{order.status}</span>
        <h1>模拟支付网关</h1>
        <p className="muted">
          正式上线后这里会替换为 Xendit 或 Midtrans 的真实支付页。本地测试仍然保留 webhook 规则：只有收到支付回调后订单才会变为已支付。
        </p>
        <p>
          <strong>{order.productTitle}</strong> · {formatIdr(order.total)}
        </p>
        <form action="/api/payments/mock" method="post">
          <input name="orderId" type="hidden" value={order.id} />
          <button className="btn" type="submit">
            模拟支付成功回调
          </button>
        </form>
        <Link className="btn secondary" href={`/account/orders/${order.id}`}>
          查看订单详情
        </Link>
      </section>
    </main>
  );
}
