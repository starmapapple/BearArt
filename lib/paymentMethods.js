export const PAYMENT_METHOD_LABELS = {
  qris: "QRIS",
  virtual_account: "虚拟账户",
  ewallet: "电子钱包",
  card: "银行卡",
  cod: "货到付款"
};

const PAYMENT_METHOD_LABELS_ID = {
  qris: "QRIS",
  virtual_account: "Virtual Account",
  ewallet: "E-Wallet",
  card: "Kartu Bank",
  cod: "COD"
};

export function paymentMethodLabel(method, locale = "zh") {
  const labels = locale === "id" ? PAYMENT_METHOD_LABELS_ID : PAYMENT_METHOD_LABELS;
  return labels[method] || method;
}

export function getEffectivePaymentMethods(methods, provider = "cod_only") {
  if (provider === "cod_only") return ["cod"];

  const configured = Array.isArray(methods) ? methods.filter(Boolean) : [];
  return configured.length ? [...new Set(configured)] : ["cod"];
}
