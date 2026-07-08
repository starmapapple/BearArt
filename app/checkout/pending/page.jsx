import CopyOrderButton from "@/components/CopyOrderButton";

export default async function PendingPage({ searchParams }) {
  const query = await searchParams;
  const orderId = query?.orderId || "";

  return (
    <main className="status-page">
      <section className="card status-card">
        <span className="pill cod_pending">COD berhasil dibuat</span>
        <h1>Terima kasih, pesanan Anda sudah kami terima.</h1>
        <p className="muted">
          Tim kami akan memeriksa detail pesanan dan menghubungi Anda jika diperlukan. Siapkan pembayaran saat paket tiba di alamat Anda.
        </p>
        {orderId ? (
          <div className="status-order-box">
            <span>Nomor pesanan</span>
            <strong>{orderId}</strong>
          </div>
        ) : null}
        <div className="status-actions">
          <CopyOrderButton orderId={orderId} />
          <a className="btn secondary" href={`/account/orders/${orderId}`}>
            Lihat status pesanan
          </a>
        </div>
      </section>
    </main>
  );
}
