export const STATUS_LABELS = {
  draft: "草稿",
  published: "已发布",
  archived: "已下架",
  awaiting_payment: "待支付",
  cod_pending: "COD待确认",
  cod_confirmed: "COD已确认",
  paid: "已支付",
  fulfilled: "已发货",
  delivered: "已签收",
  cancelled: "已取消",
  expired: "已过期"
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || "未知";
}
