import AdminShell from "@/components/AdminShell";
import ResetAnalyticsButton from "@/components/ResetAnalyticsButton";
import { getAnalyticsSummary } from "@/lib/analytics";
import { getOrders, getProducts } from "@/lib/store";
import { getAdminLocale } from "@/lib/adminLocaleServer";
import { adminDateLocale, translateAdmin } from "@/lib/adminI18n";

export default async function AnalyticsPage({ searchParams }) {
  const query = await searchParams;
  const locale = await getAdminLocale();
  const t = (text) => translateAdmin(locale, text);
  const [orders, products] = await Promise.all([getOrders(), getProducts()]);
  const days = Number(query?.days || 30);
  const productSlug = query?.product || "all";
  const summary = await getAnalyticsSummary({ orders, products, days, productSlug });

  return (
    <AdminShell locale={locale}>
      <div className="page-head">
        <div>
          <h2>{t("转化分析")}</h2>
          <p className="muted">{t("按流量来源、页面互动、结账表单和支付方式分析 ColorBear 落地页漏斗。")}</p>
          {summary.baselineAt ? <small className="analytics-baseline">{t("统计起点")}：{new Date(summary.baselineAt).toLocaleString(adminDateLocale(locale), { timeZone: "Asia/Jakarta" })}</small> : null}
        </div>
        <ResetAnalyticsButton />
      </div>

      <form className="analytics-filter admin-filter-panel">
        <label>
          {t("时间范围")}
          <select name="days" defaultValue={String(days)}>
            <option value="7">{t("最近 7 天")}</option>
            <option value="14">{t("最近 14 天")}</option>
            <option value="30">{t("最近 30 天")}</option>
            <option value="90">{t("最近 90 天")}</option>
          </select>
        </label>
        <label>
          {t("落地页")}
          <select name="product" defaultValue={productSlug}>
            <option value="all">{t("全部落地页")}</option>
            {products.map((product) => (
              <option key={product.id} value={product.slug}>
                /p/{product.slug}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" type="submit">
          {t("查看")}
        </button>
      </form>

      <section className="stats-grid analytics-stats">
        <Stat label={t("访问量")} value={summary.totals.pageViews} />
        <Stat label={t("访客")} value={summary.totals.visitors} />
        <Stat label={t("订单")} value={summary.totals.orders} note={`${t("访问转化")} ${summary.totals.orderRate}`} />
        <Stat label="GMV" value={summary.totals.revenueText} note={t("含 COD 待确认")} />
        <Stat label={t("打开结账率")} value={summary.totals.checkoutRate} />
        <Stat label={t("提交转化率")} value={summary.totals.submitRate} />
        <Stat label={t("COD 占比")} value={summary.totals.codShare} />
        <Stat label={t("支付/确认率")} value={summary.totals.paidRate} />
      </section>

      <section className="analytics-grid">
        <div className="card">
          <h3>{t("核心漏斗")}</h3>
          <div className="funnel-list">
            {summary.funnel.map((step) => (
              <div className="funnel-row" key={step.label}>
                <div>
                  <strong>{t(step.label)}</strong>
                  <span>{step.rate}</span>
                </div>
                <div className="funnel-track">
                  <span style={{ width: step.rate }} />
                </div>
                <b>{step.value}</b>
              </div>
            ))}
          </div>
        </div>

        <MetricCard title={t("页面互动")} rows={summary.engagement} valueKey="value" translateLabel={t} />
      </section>

      <section className="analytics-stack">
        <AnalyticsTable t={t} title={t("投放来源")} rows={summary.sources} columns={[t("访问量"), t("会话"), t("订单"), t("转化"), "COD", "GMV"]} renderRow={(row) => [row.visits, row.sessions, row.orders, row.conversionRate, row.codShare, row.revenueText]} />
        <AnalyticsTable t={t} title={t("支付方式")} rows={summary.payment} columns={[t("订单"), "GMV", t("COD 占比"), t("支付/确认率")]} renderRow={(row) => [row.orders, row.revenueText, row.codShare, row.paidRate]} />
      </section>

      <section className="analytics-stack">
        <AnalyticsTable t={t} title={t("表单问题")} rows={summary.formErrors} columns={[t("次数"), t("会话")]} renderRow={(row) => [row.events, row.sessions]} />
        <AnalyticsTable t={t} title={t("地区表现")} rows={summary.regions} columns={[t("订单"), "GMV", t("COD 占比"), t("支付/确认率")]} renderRow={(row) => [row.orders, row.revenueText, row.codShare, row.paidRate]} />
      </section>

      <section className="analytics-stack">
        <AnalyticsTable t={t} title={t("设备表现")} rows={summary.devices} columns={[t("事件"), t("会话")]} renderRow={(row) => [row.events, row.sessions]} />
        <div className="card">
          <h3>{t("最近事件")}</h3>
          <div className="recent-events">
            {summary.recentEvents.length ? (
              summary.recentEvents.map((event) => (
                <div key={event.id}>
                  <strong>{event.name}</strong>
                  <span>
                    /p/{event.productSlug || "-"} · {event.lastAttribution?.utm_source || "direct"} · {new Date(event.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">{t("暂无事件。打开落地页并操作后会出现在这里。")}</p>
            )}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function Stat({ label, value, note }) {
  return (
    <div className="card">
      <p className="muted">{label}</p>
      <h3>{value}</h3>
      {note ? <small className="muted">{note}</small> : null}
    </div>
  );
}

function MetricCard({ title, rows, valueKey, translateLabel = (value) => value }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="metric-list">
        {rows.map((row) => (
          <div key={row.label}>
            <span>{translateLabel(row.label)}</span>
            <strong>{row[valueKey]}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTable({ title, rows, columns, renderRow, t }) {
  return (
    <div className="card table-wrap">
      <h3>{title}</h3>
      {rows.length ? (
        <table className="analytics-table">
          <thead>
            <tr>
              <th>{t("维度")}</th>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>
                  <strong>{row.label}</strong>
                </td>
                {renderRow(row).map((value, index) => (
                  <td key={`${row.label}-${columns[index]}`}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted">{t("暂无数据。")}</p>
      )}
    </div>
  );
}
