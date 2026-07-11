import AdminShell from "@/components/AdminShell";
import { filterOrders, formatIdr, getOrders } from "@/lib/store";
import { statusLabel } from "@/lib/adminLabels";
import { PAYMENT_METHOD_LABELS, paymentMethodLabel } from "@/lib/paymentMethods";
import { getAdminLocale } from "@/lib/adminLocaleServer";
import { adminDateLocale, translateAdmin } from "@/lib/adminI18n";

export default async function OrdersPage({ searchParams }) {
  const query = await searchParams;
  const locale = await getAdminLocale();
  const t = (text) => translateAdmin(locale, text);
  const allOrders = await getOrders();
  const filters = {
    status: query?.status || "all",
    paymentMethod: query?.paymentMethod || "all",
    productSlug: query?.productSlug || "all",
    province: query?.province || "all",
    from: query?.from || "",
    to: query?.to || ""
  };
  const orders = filterOrders(allOrders, filters);
  const products = unique(allOrders.map((order) => order.productSlug).filter(Boolean));
  const provinces = unique(allOrders.map((order) => order.customer?.province).filter(Boolean));
  const exportHref = `/api/orders/export?${new URLSearchParams(compactFilters(filters)).toString()}`;
  const returnTo = `/admin/orders?${new URLSearchParams(compactFilters(filters)).toString()}`;

  return (
    <AdminShell locale={locale}>
      <div className="page-head">
        <div>
          <h2>{t("订单管理")}</h2>
          <p className="muted">{t("导出订单给仓库或客服，先用人工方式处理发货和 COD 确认。")}</p>
        </div>
        <a className="btn" href={exportHref}>
          {t("导出 CSV")}
        </a>
      </div>

      <form className="orders-filter admin-filter-panel">
        <label>
          {t("状态")}
          <select name="status" defaultValue={filters.status}>
            <option value="all">{t("全部状态")}</option>
            {["cod_pending", "cod_confirmed", "awaiting_payment", "paid", "fulfilled", "delivered", "cancelled", "expired"].map((status) => (
              <option value={status} key={status}>
                {statusLabel(status, locale)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("支付")}
          <select name="paymentMethod" defaultValue={filters.paymentMethod}>
            <option value="all">{t("全部支付")}</option>
            {Object.keys(PAYMENT_METHOD_LABELS).map((value) => (
              <option key={value} value={value}>
                {paymentMethodLabel(value, locale)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("落地页")}
          <select name="productSlug" defaultValue={filters.productSlug}>
            <option value="all">{t("全部落地页")}</option>
            {products.map((slug) => (
              <option key={slug} value={slug}>
                /p/{slug}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("省份")}
          <select name="province" defaultValue={filters.province}>
            <option value="all">{t("全部省份")}</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("开始")}
          <input name="from" type="date" defaultValue={filters.from} />
        </label>
        <label>
          {t("结束")}
          <input name="to" type="date" defaultValue={filters.to} />
        </label>
        <button className="btn" type="submit">
          {t("筛选")}
        </button>
      </form>

      <div className="card table-wrap">
        {orders.length ? (
          <table className="orders-table">
            <thead>
              <tr>
                <th>{t("订单")}</th><th>{t("状态")}</th><th>{t("商品")}</th><th>{t("客户")}</th><th>{t("支付")}</th><th>{t("金额")}</th><th>{t("创建时间")}</th><th>{t("操作")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <code className="order-id">{order.id}</code>
                  </td>
                  <td>
                    <span className={`pill ${order.status}`}>{statusLabel(order.status, locale)}</span>
                  </td>
                  <td>
                    <div className="order-product-cell">
                      <strong>{order.productTitle}</strong>
                      <span className="muted">
                      /p/{order.productSlug} · {order.variant} · x{order.quantity}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="order-customer-cell">
                      <strong>{order.customer?.name || "-"}</strong>
                      <span>{order.customer?.phone || "-"}</span>
                      <span>
                        {order.customer?.province} {order.customer?.city}
                      </span>
                      <small>{order.customer?.address}</small>
                    </div>
                    {order.customer?.postalCode ? <div className="muted">{t("邮编")}：{order.customer.postalCode}</div> : null}
                    {order.location?.lat && order.location?.lon ? (
                      <div className="muted">
                        {t("定位")}：{order.location.lat.toFixed(5)}, {order.location.lon.toFixed(5)}
                      </div>
                    ) : null}
                  </td>
                  <td>{paymentMethodLabel(order.paymentMethod, locale)}</td>
                  <td>
                    <strong className="order-total">{formatIdr(order.total)}</strong>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleString(adminDateLocale(locale))}</td>
                  <td>
                    <OrderActions order={order} returnTo={returnTo} locale={locale} t={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">{t("暂无订单。")}</div>
        )}
      </div>
    </AdminShell>
  );
}

function OrderActions({ order, returnTo, locale, t }) {
  const actions = availableActions(order, locale);
  if (!actions.length) return <span className="muted">{t("暂无操作")}</span>;

  return (
    <div className="order-actions">
      {actions.map((action) => (
        <form key={action.status} action={`/api/admin/orders/${order.id}/status`} method="post">
          <input type="hidden" name="status" value={action.status} />
          <input type="hidden" name="note" value={action.label} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className={action.danger ? "btn warn small" : "btn secondary small"} type="submit">
            {action.label}
          </button>
        </form>
      ))}
    </div>
  );
}

function availableActions(order, locale) {
  const actions = [];
  const label = (zh, id) => locale === "id" ? id : zh;
  if (order.status === "cod_pending") actions.push({ status: "cod_confirmed", label: label("确认COD", "Konfirmasi COD") });
  if (order.status === "awaiting_payment") actions.push({ status: "paid", label: label("标记已支付", "Tandai Dibayar") });
  if (["cod_confirmed", "paid"].includes(order.status)) actions.push({ status: "fulfilled", label: label("标记发货", "Tandai Dikirim") });
  if (order.status === "fulfilled") actions.push({ status: "delivered", label: label("标记签收", "Tandai Diterima") });
  if (!["cancelled", "expired", "delivered"].includes(order.status)) actions.push({ status: "cancelled", label: label("取消", "Batalkan"), danger: true });
  return actions;
}

function unique(values) {
  return [...new Set(values)];
}

function compactFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value && value !== "all"));
}
