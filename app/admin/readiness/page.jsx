import AdminShell from "@/components/AdminShell";
import { getReadinessChecks } from "@/lib/readiness";
import { getAdminLocale } from "@/lib/adminLocaleServer";
import { translateAdmin } from "@/lib/adminI18n";

export default async function ReadinessPage() {
  const locale = await getAdminLocale();
  const t = (text) => translateAdmin(locale, text);
  const checks = getReadinessChecks();
  const readyCount = checks.filter((item) => item.ready).length;

  return (
    <AdminShell locale={locale}>
      <div className="page-head">
        <div>
          <h2>{t("上线检查")}</h2>
          <p className="muted">{t("检查正式投放前必须配置的环境变量和外部服务。")}</p>
        </div>
      </div>

      <section className="stats-grid">
        <div className="card">
          <p className="muted">{t("已完成")}</p>
          <h3>
            {readyCount}/{checks.length}
          </h3>
        </div>
        <div className="card">
          <p className="muted">{t("支付模式")}</p>
          <h3>{process.env.PAYMENT_PROVIDER || "cod_only"}</h3>
        </div>
      </section>

      <section className="card readiness-panel">
        <div className="section-title-row">
          <div>
            <h3>{t("配置清单")}</h3>
            <p className="muted">{t("缺失项会影响正式域名、支付、后台安全或数据持久化。")}</p>
          </div>
        </div>
        <div className="readiness-list">
        {checks.map((item) => (
          <div key={item.envKey}>
            <span className={item.ready ? "pill paid" : item.optional ? "pill awaiting_payment" : "pill cancelled"}>
              {item.ready ? t("已配置") : item.optional ? t("可选") : t("缺失")}
            </span>
            <strong>{t(item.label)}</strong>
            <code>{item.envKey}</code>
          </div>
        ))}
        </div>
      </section>

      <section className="card">
        <h3>{t("数据库迁移提醒")}</h3>
        <p className="muted">
          {locale === "id"
            ? "Proyek mendukung DATABASE_URL. Setelah PostgreSQL/Supabase/Neon terhubung, produk, pesanan, dan event analytics disimpan ke database. Fallback JSON hanya cocok untuk pengembangan lokal."
            : "当前项目已支持 DATABASE_URL：配置 PostgreSQL/Supabase/Neon 连接串后，商品、订单和 analytics 事件会写入数据库。未配置时会保留 JSON fallback，只适合本地开发和演示。"}
        </p>
      </section>
    </AdminShell>
  );
}
