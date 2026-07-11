import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Syarat Pembelian | Beart Art Shop" };

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Ketentuan toko"
      title="Syarat Pembelian"
      intro="Dengan membuat pesanan, pelanggan menyetujui harga, metode pembayaran, dan informasi produk yang ditampilkan pada saat checkout."
    >
      <Section title="Pemesanan">
        <p>Pastikan nama, nomor WhatsApp, dan alamat pengiriman benar. Pesanan dianggap masuk setelah nomor pesanan diterbitkan dan dapat dikonfirmasi kembali oleh Customer Service.</p>
      </Section>
      <Section title="Pembayaran COD">
        <p>Pembayaran dilakukan kepada kurir saat paket diterima. Pelanggan wajib menyiapkan pembayaran sesuai total pesanan dan menerima paket yang telah dikonfirmasi.</p>
      </Section>
      <Section title="Harga dan promo">
        <p>Harga, diskon, bonus, dan masa promo mengikuti informasi yang tampil ketika pesanan dibuat. Promo dapat berakhir atau berubah tanpa pemberitahuan sebelumnya.</p>
      </Section>
      <Section title="Bonus produk">
        <p>Bonus dikirim selama persediaan masih tersedia. Ukuran dan warna bonus dapat dikirim secara acak. Permintaan khusus dapat disampaikan melalui WhatsApp, namun tidak dapat dijamin.</p>
      </Section>
      <Section title="Pembatalan">
        <p>Pembatalan dapat diminta sebelum paket diproses atau diserahkan kepada kurir. Hubungi Customer Service dengan menyertakan nomor pesanan.</p>
      </Section>
      <Section title="Penggunaan materi">
        <p>Materi kelas dan konten ColorBear Art ditujukan untuk penggunaan pribadi pembeli dan tidak boleh dijual kembali, disalin, atau dibagikan tanpa izin.</p>
      </Section>
    </PolicyPage>
  );
}

function Section({ title, children }) {
  return <section><h2>{title}</h2>{children}</section>;
}
