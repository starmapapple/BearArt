import PublicHeader from "@/components/PublicHeader";
import OrderLookup from "@/components/OrderLookup";
import { assetUrl } from "@/lib/assets";

const supportWhatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "6285215448518";

export const metadata = {
  title: "个人中心",
  description: "查询订单状态和购买记录。"
};

export default async function AccountPage({ searchParams }) {
  const query = await searchParams;
  const fromColorBear = query?.from === "colorbear";

  return (
    <main className="public-page with-nav">
      <PublicHeader locale={fromColorBear ? "id" : "zh"} mode={fromColorBear ? "product-only" : "default"} />
      <section className="site-section narrow">
        <div className="page-head">
          <div>
            <h1>{fromColorBear ? "Akun Saya" : "个人中心"}</h1>
            <p className="muted">
              {fromColorBear
                ? "Masukkan nomor pesanan atau nomor WhatsApp untuk melihat status pesanan."
                : "输入订单号或下单 WhatsApp 手机号，查看订单状态和后续发货进度。"}
            </p>
          </div>
        </div>
        <OrderLookup locale={fromColorBear ? "id" : "zh"} />
        <ContactSupportCard locale={fromColorBear ? "id" : "zh"} />
      </section>
    </main>
  );
}

function ContactSupportCard({ locale = "zh" }) {
  const isId = locale === "id";
  const message = isId
    ? "Halo Beart Art Shop, saya ingin bertanya tentang pesanan ColorBear Art."
    : "你好 Beart Art Shop，我想咨询 ColorBear Art 订单。";
  const whatsappUrl = `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(message)}`;

  return (
    <section className="card support-card">
      <div className="support-copy">
        <span className="support-icon" aria-hidden="true">
          <img alt="" src={assetUrl("/icons/whatsapp-green.webp")} />
        </span>
        <div>
          <span className="support-kicker">{isId ? "Butuh bantuan?" : "需要帮助？"}</span>
          <h2>{isId ? "Hubungi Customer Service WhatsApp" : "联系 WhatsApp 客服"}</h2>
          <p className="muted">
            {isId
              ? "Jika tidak menemukan pesanan atau ingin konfirmasi alamat, chat tim kami lewat WhatsApp."
              : "如果查不到订单，或需要确认收货地址，可以通过 WhatsApp 联系客服。"}
          </p>
        </div>
      </div>
      <a className="btn support-wa-button" href={whatsappUrl} rel="noreferrer" target="_blank">
        <span className="support-wa-mask" aria-hidden="true" />
        {isId ? "Chat via WhatsApp" : "打开 WhatsApp"}
      </a>
    </section>
  );
}
