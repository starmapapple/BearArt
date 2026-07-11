import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Pengiriman dan Retur | Beart Art Shop" };

export default function ShippingReturnsPage() {
  return (
    <PolicyPage
      eyebrow="Bantuan pesanan"
      title="Pengiriman & Retur"
      intro="Kami membantu memastikan paket dikirim ke alamat yang benar dan menangani kendala produk secara jelas."
    >
      <Section title="Proses pengiriman">
        <p>Pesanan COD akan diperiksa dan diproses setelah data penerima lengkap. Waktu pengiriman bergantung pada kota tujuan, ketersediaan kurir, dan kondisi operasional.</p>
      </Section>
      <Section title="Perubahan alamat">
        <p>Perubahan alamat hanya dapat dilakukan sebelum paket diserahkan kepada kurir. Hubungi Customer Service sesegera mungkin dengan nomor pesanan.</p>
      </Section>
      <Section title="Paket rusak atau produk tidak sesuai">
        <p>Hubungi kami paling lambat 2 × 24 jam setelah paket diterima. Sertakan nomor pesanan, foto kondisi paket, foto produk, dan video pembukaan paket agar pemeriksaan dapat dilakukan.</p>
      </Section>
      <Section title="Retur dan penggantian">
        <p>Penggantian dapat diberikan setelah verifikasi untuk barang utama yang rusak, kurang, atau tidak sesuai pesanan. Produk harus belum digunakan dan dikembalikan lengkap apabila diminta.</p>
      </Section>
      <Section title="Ketentuan bonus">
        <p>Bonus tidak dapat diretur atau ditukar karena ukuran, warna, atau model dikirim secara acak. Kami tetap akan membantu jika bonus yang diterima rusak saat pengiriman.</p>
      </Section>
    </PolicyPage>
  );
}

function Section({ title, children }) {
  return <section><h2>{title}</h2>{children}</section>;
}
