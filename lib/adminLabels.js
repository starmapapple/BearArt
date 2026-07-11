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

export const STATUS_LABELS_ID = {
  draft: "Draf",
  published: "Dipublikasikan",
  archived: "Dinonaktifkan",
  awaiting_payment: "Menunggu Pembayaran",
  cod_pending: "COD Menunggu Konfirmasi",
  cod_confirmed: "COD Dikonfirmasi",
  paid: "Dibayar",
  fulfilled: "Dikirim",
  delivered: "Diterima",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa"
};

export function statusLabel(status, locale = "zh") {
  const labels = locale === "id" ? STATUS_LABELS_ID : STATUS_LABELS;
  return labels[status] || status || (locale === "id" ? "Tidak diketahui" : "未知");
}
