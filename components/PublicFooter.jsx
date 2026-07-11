import Link from "next/link";

const supportWhatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "6285123947146";

export default function PublicFooter() {
  return (
    <footer className="public-policy-footer">
      <strong>Beart Art Shop</strong>
      <nav aria-label="Kebijakan toko">
        <Link href="/privacy">Privasi</Link>
        <Link href="/terms">Syarat Pembelian</Link>
        <Link href="/shipping-returns">Pengiriman &amp; Retur</Link>
      </nav>
      <a href={`https://wa.me/${supportWhatsapp}`} target="_blank" rel="noreferrer">
        Hubungi CS WhatsApp
      </a>
      <small>© {new Date().getFullYear()} Beart Art Shop. Seluruh hak dilindungi.</small>
    </footer>
  );
}
