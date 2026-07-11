import AdminShell from "@/components/AdminShell";
import { getAuditLogs } from "@/lib/auditLog";
import { getAdminLocale } from "@/lib/adminLocaleServer";
import { adminDateLocale, translateAdmin } from "@/lib/adminI18n";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const logs = await getAuditLogs(300);
  const locale = await getAdminLocale();
  const t = (text) => translateAdmin(locale, text);

  return (
    <AdminShell locale={locale}>
      <div className="page-head">
        <div>
          <h2>{t("操作日志")}</h2>
          <p>{t("记录后台素材、落地页、订单等关键变更，方便追溯每一次操作。")}</p>
        </div>
      </div>

      <section className="card audit-log-panel">
        {logs.length ? (
          logs.map((log) => (
            <article className="audit-log-item" key={log.id}>
              <div className="audit-log-head">
                <div>
                  <span className="pill published">{t(actionLabel(log.action))}</span>
                  <span className="pill archived">{t(entityLabel(log.entityType))}</span>
                </div>
                <time>{formatDateTime(log.createdAt, locale)}</time>
              </div>
              <strong>{log.summary}</strong>
              {log.entityId ? <code>{log.entityId}</code> : null}
              {log.details && Object.keys(log.details).length ? (
                <details className="audit-log-details">
                  <summary>{t("查看变更详情")}</summary>
                  <pre>{JSON.stringify(log.details, null, 2)}</pre>
                </details>
              ) : null}
            </article>
          ))
        ) : (
          <p className="muted">{t("暂无操作日志。后台发生变更后会显示在这里。")}</p>
        )}
      </section>
    </AdminShell>
  );
}

function actionLabel(action) {
  const labels = {
    asset_uploaded: "上传素材",
    asset_compressed: "压缩素材",
    asset_deleted: "删除素材",
    asset_replaced: "替换素材",
    asset_applied: "应用素材",
    product_created: "新增落地页",
    product_updated: "更新落地页",
    order_status_changed: "订单状态"
    ,analytics_baseline_reset: "重置分析统计"
  };
  return labels[action] || action;
}

function entityLabel(type) {
  const labels = {
    asset: "素材",
    product: "落地页",
    order: "订单",
    system: "系统"
  };
  return labels[type] || type;
}

function formatDateTime(value, locale) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(adminDateLocale(locale), {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(value));
}
