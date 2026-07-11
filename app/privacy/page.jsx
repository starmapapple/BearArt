import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Kebijakan Privasi | Beart Art Shop" };

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Keamanan data"
      title="Kebijakan Privasi"
      intro="Kami hanya menggunakan data yang diperlukan untuk memproses pesanan, mengirim paket, dan membantu pelanggan."
    >
      <Section title="Data yang kami kumpulkan">
        <p>Nama penerima, nomor WhatsApp, alamat pengiriman, provinsi, kota/kabupaten, pilihan produk, serta status pesanan.</p>
        <p>Jika Anda memilih fitur lokasi, koordinat digunakan untuk membantu menentukan wilayah pengiriman. Fitur ini bersifat opsional.</p>
      </Section>
      <Section title="Cara kami menggunakan data">
        <p>Data digunakan untuk konfirmasi COD, pemrosesan dan pengiriman pesanan, layanan pelanggan, pencegahan penyalahgunaan, serta analisis kinerja halaman secara agregat.</p>
      </Section>
      <Section title="Berbagi data">
        <p>Informasi pengiriman dapat dibagikan kepada mitra logistik dan penyedia layanan yang membantu pemenuhan pesanan. Kami tidak menjual data pribadi pelanggan.</p>
      </Section>
      <Section title="Penyimpanan dan hak Anda">
        <p>Data disimpan selama diperlukan untuk operasional, kewajiban pencatatan, dan penyelesaian sengketa. Anda dapat meminta koreksi atau penghapusan data yang tidak lagi diperlukan melalui WhatsApp Customer Service.</p>
      </Section>
      <Section title="Cookie dan analitik">
        <p>Kami menggunakan penyimpanan browser dan data teknis seperti perangkat, sumber kunjungan, dan interaksi halaman untuk mengingat formulir serta meningkatkan pengalaman belanja. Data analitik tidak menyimpan alamat lengkap atau nomor WhatsApp.</p>
      </Section>
    </PolicyPage>
  );
}

function Section({ title, children }) {
  return <section><h2>{title}</h2>{children}</section>;
}
