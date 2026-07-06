export default async function PendingPage({ searchParams }) {
  const query = await searchParams;
  const orderId = query?.orderId || "";

  return (
    <main className="status-page">
      <section className="card status-card">
        <span className="pill cod_pending">COD待确认</span>
        <h1>COD 订单已提交</h1>
        <p className="muted">订单 {orderId} 正在等待人工确认，后续可从后台导出发货。</p>
        <a className="btn secondary" href={`/account/orders/${orderId}`}>
          查看订单详情
        </a>
      </section>
    </main>
  );
}
