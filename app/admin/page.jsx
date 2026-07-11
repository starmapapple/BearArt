import AdminShell from "@/components/AdminShell";
import Link from "next/link";
import { formatIdr, getOrders, getProducts } from "@/lib/store";
import { getAdminLocale } from "@/lib/adminLocaleServer";
import { translateAdmin } from "@/lib/adminI18n";

export default async function AdminDashboard() {
  const locale = await getAdminLocale();
  const t = (text) => translateAdmin(locale, text);
  const [products, orders] = await Promise.all([getProducts(), getOrders()]);
  const paidRevenue = orders.filter((order) => order.status === "paid").reduce((sum, order) => sum + order.total, 0);
  const codPending = orders.filter((order) => order.status === "cod_pending").length;
  const draftProducts = products.filter((product) => product.status === "draft").length;
  const pendingOrders = orders.filter((order) => ["cod_pending", "awaiting_payment"].includes(order.status)).length;

  return (
    <AdminShell locale={locale}>
      <div className="page-head">
        <div>
          <h2>{t("数据概览")}</h2>
          <p className="muted">{t("查看独立落地页、订单和印尼单品投放漏斗的运行状态。")}</p>
        </div>
      </div>
      <section className="stats-grid">
        <div className="card">
          <p className="muted">{t("落地页总数")}</p>
          <h3>{products.length}</h3>
        </div>
        <div className="card">
          <p className="muted">{t("已发布")}</p>
          <h3>{products.filter((product) => product.status === "published").length}</h3>
        </div>
        <div className="card">
          <p className="muted">{t("订单总数")}</p>
          <h3>{orders.length}</h3>
        </div>
        <div className="card">
          <p className="muted">{t("已支付收入")}</p>
          <h3>{formatIdr(paidRevenue)}</h3>
        </div>
      </section>
      <section className="admin-dashboard-grid">
        <div className="card admin-alert-card">
          <div>
            <span className="admin-card-kicker">{t("今日重点")}</span>
            <h3>{t("优先处理 COD 和待付款订单")}</h3>
            <p className="muted">
              {locale === "id" ? <>Ada <strong>{pendingOrders}</strong> pesanan yang perlu diproses, termasuk <strong>{codPending}</strong> pesanan COD yang menunggu konfirmasi.</> : <>待处理订单 <strong>{pendingOrders}</strong> 个，其中 COD 待确认 <strong>{codPending}</strong> 个。在线支付必须以支付网关 webhook 为准，成功跳转页不作为真实收款依据。</>}
            </p>
          </div>
          <Link className="btn" href="/admin/orders">
            {t("查看订单")}
          </Link>
        </div>
        <div className="card admin-quick-card">
          <span className="admin-card-kicker">{t("常用入口")}</span>
          <div className="admin-quick-links">
            <Link href="/admin/assets">{t("管理素材")}</Link>
            <Link href="/admin/products">{t("编辑落地页")}</Link>
            <Link href="/admin/analytics">{t("查看转化")}</Link>
            <Link href="/admin/readiness">{t("上线检查")}</Link>
          </div>
        </div>
        <div className="card admin-quick-card">
          <span className="admin-card-kicker">{t("页面状态")}</span>
          <div className="admin-status-stack">
            <div>
              <span>{t("草稿落地页")}</span>
              <strong>{draftProducts}</strong>
            </div>
            <div>
              <span>{t("已发布落地页")}</span>
              <strong>{products.filter((product) => product.status === "published").length}</strong>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
