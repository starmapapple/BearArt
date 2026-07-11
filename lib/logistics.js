const BITESHIP_BASE_URL = "https://api.biteship.com";

export function getLogisticsConfig() {
  const provider = String(process.env.LOGISTICS_PROVIDER || "disabled").toLowerCase();
  const config = {
    provider,
    enabled: provider !== "disabled",
    apiKey: process.env.BITESHIP_API_KEY || "",
    webhookToken: process.env.BITESHIP_WEBHOOK_TOKEN || "",
    origin: {
      contactName: process.env.LOGISTICS_ORIGIN_CONTACT_NAME || "",
      contactPhone: process.env.LOGISTICS_ORIGIN_CONTACT_PHONE || "",
      address: process.env.LOGISTICS_ORIGIN_ADDRESS || "",
      postalCode: process.env.LOGISTICS_ORIGIN_POSTAL_CODE || ""
    },
    defaults: {
      courierCompany: process.env.LOGISTICS_DEFAULT_COURIER || "sicepat",
      courierType: process.env.LOGISTICS_DEFAULT_COURIER_TYPE || "reg",
      weight: positiveNumber(process.env.LOGISTICS_DEFAULT_WEIGHT_GRAMS, 1000),
      length: positiveNumber(process.env.LOGISTICS_DEFAULT_LENGTH_CM, 30),
      width: positiveNumber(process.env.LOGISTICS_DEFAULT_WIDTH_CM, 25),
      height: positiveNumber(process.env.LOGISTICS_DEFAULT_HEIGHT_CM, 10),
      codDisbursement: process.env.LOGISTICS_COD_DISBURSEMENT || "7_days"
    }
  };
  config.ready = provider === "biteship" && Boolean(
    config.apiKey &&
    config.origin.contactName &&
    config.origin.contactPhone &&
    config.origin.address &&
    config.origin.postalCode
  );
  return config;
}

export async function createShipment(order, input = {}) {
  const config = getLogisticsConfig();
  ensureReady(config);
  if (config.provider !== "biteship") {
    throw new Error(`暂不支持物流供应商：${config.provider}`);
  }

  const postalCode = String(input.destinationPostalCode || order.customer?.postalCode || "").trim();
  if (!postalCode) throw new Error("创建运单前请填写收件邮政编码。");
  const courierCompany = String(input.courierCompany || config.defaults.courierCompany).trim().toLowerCase();
  const courierType = String(input.courierType || config.defaults.courierType).trim().toLowerCase();
  const weight = positiveNumber(input.weight, config.defaults.weight);
  const length = positiveNumber(input.length, config.defaults.length);
  const width = positiveNumber(input.width, config.defaults.width);
  const height = positiveNumber(input.height, config.defaults.height);

  const payload = {
    shipper_contact_name: config.origin.contactName,
    shipper_contact_phone: config.origin.contactPhone,
    shipper_organization: "Bear Art Shop",
    origin_contact_name: config.origin.contactName,
    origin_contact_phone: config.origin.contactPhone,
    origin_address: config.origin.address,
    origin_postal_code: Number(config.origin.postalCode),
    destination_contact_name: order.customer?.name,
    destination_contact_phone: order.customer?.phone,
    destination_address: [order.customer?.address, order.customer?.city, order.customer?.province].filter(Boolean).join(", "),
    destination_postal_code: Number(postalCode),
    destination_cash_on_delivery: order.paymentMethod === "cod" ? Number(order.total || 0) : undefined,
    destination_cash_on_delivery_type: order.paymentMethod === "cod" ? config.defaults.codDisbursement : undefined,
    courier_company: courierCompany,
    courier_type: courierType,
    delivery_type: "now",
    reference_id: order.id,
    metadata: { grupbeli_order_id: order.id, product_slug: order.productSlug },
    order_note: `GrupBeli ${order.id}`,
    tags: ["grupbeli", order.productSlug].filter(Boolean),
    items: [
      {
        name: order.productTitle,
        description: order.variant || undefined,
        category: "hobby",
        sku: order.productSku || order.productSlug,
        value: Number(order.unitPrice || order.total || 0),
        quantity: Number(order.quantity || 1),
        weight,
        length,
        width,
        height
      }
    ]
  };

  const result = await biteshipRequest("/v1/orders", { method: "POST", body: payload }, config);
  return normalizeBiteshipOrder(result, {
    destinationPostalCode: postalCode,
    package: { weight, length, width, height }
  });
}

export async function refreshShipment(shipping) {
  const config = getLogisticsConfig();
  ensureReady(config);
  if (!shipping?.providerOrderId) throw new Error("订单还没有物流单。");
  const result = await biteshipRequest(`/v1/orders/${encodeURIComponent(shipping.providerOrderId)}`, {}, config);
  return normalizeBiteshipOrder(result, {
    destinationPostalCode: shipping.destinationPostalCode,
    package: shipping.package
  });
}

export async function cancelShipment(shipping) {
  const config = getLogisticsConfig();
  ensureReady(config);
  if (!shipping?.providerOrderId) throw new Error("订单还没有物流单。");
  const result = await biteshipRequest(
    `/v1/orders/${encodeURIComponent(shipping.providerOrderId)}/cancel`,
    { method: "POST", body: { cancellation_reason_code: "change_courier" } },
    config
  );
  return {
    ...shipping,
    status: result.status || "cancelled",
    providerPayload: compactProviderPayload(result)
  };
}

export function normalizeBiteshipWebhook(payload = {}) {
  const source = payload.data?.order || payload.data || payload.order || payload;
  return {
    provider: "biteship",
    providerOrderId: String(source.order_id || source.id || ""),
    trackingId: String(source.courier_tracking_id || source.courier?.tracking_id || ""),
    waybillId: String(source.courier_waybill_id || source.courier?.waybill_id || ""),
    courierCompany: String(source.courier_company || source.courier?.company || "").toLowerCase(),
    courierType: String(source.courier_type || source.courier?.type || "").toLowerCase(),
    trackingUrl: String(source.courier_link || source.courier?.link || ""),
    status: normalizeShippingStatus(source.status),
    providerStatus: String(source.status || ""),
    price: Number(source.price || source.order_price || 0),
    codFee: Number(source.cash_on_delivery_fee || source.destination?.cash_on_delivery?.fee || 0),
    lastEvent: String(payload.event || "order.status")
  };
}

export function orderStatusForShippingStatus(shippingStatus, currentStatus) {
  if (shippingStatus === "delivered") return "delivered";
  if (["picked", "in_transit", "dropping_off"].includes(shippingStatus)) return "fulfilled";
  return currentStatus;
}

export function shippingStatusLabel(status, locale = "zh") {
  const zh = {
    not_created: "未创建运单",
    confirmed: "待取件",
    scheduled: "已预约取件",
    allocated: "已分配快递员",
    picking_up: "快递员取件中",
    picked: "已取件",
    in_transit: "运输中",
    dropping_off: "派送中",
    delivered: "已签收",
    on_hold: "物流暂停",
    return_in_transit: "退回中",
    returned: "已退回",
    rejected: "物流拒绝",
    courier_not_found: "暂无可用快递员",
    cancelled: "运单已取消",
    disposed: "已处置",
    unknown: "状态待同步"
  };
  const id = {
    not_created: "Belum dibuat",
    confirmed: "Menunggu pickup",
    scheduled: "Pickup dijadwalkan",
    allocated: "Kurir dialokasikan",
    picking_up: "Kurir menuju pickup",
    picked: "Sudah diambil",
    in_transit: "Dalam perjalanan",
    dropping_off: "Sedang diantar",
    delivered: "Terkirim",
    on_hold: "Pengiriman ditahan",
    return_in_transit: "Dalam proses retur",
    returned: "Sudah diretur",
    rejected: "Pengiriman ditolak",
    courier_not_found: "Kurir tidak tersedia",
    cancelled: "Dibatalkan",
    disposed: "Dimusnahkan",
    unknown: "Menunggu sinkronisasi"
  };
  return (locale === "id" ? id : zh)[status] || status || (locale === "id" ? "Belum dibuat" : "未创建运单");
}

function normalizeBiteshipOrder(result = {}, preserved = {}) {
  const courier = result.courier || {};
  const cod = result.destination?.cash_on_delivery || {};
  return {
    provider: "biteship",
    providerOrderId: String(result.id || ""),
    trackingId: String(courier.tracking_id || ""),
    waybillId: String(courier.waybill_id || ""),
    courierCompany: String(courier.company || "").toLowerCase(),
    courierType: String(courier.type || "").toLowerCase(),
    trackingUrl: String(courier.link || ""),
    status: normalizeShippingStatus(result.status),
    providerStatus: String(result.status || ""),
    price: Number(result.price || 0),
    codAmount: Number(cod.amount || 0),
    codFee: Number(cod.fee || 0),
    destinationPostalCode: preserved.destinationPostalCode || result.destination?.postal_code || "",
    package: preserved.package || {},
    labelUrl: "",
    labelSource: "biteship_dashboard",
    providerPayload: compactProviderPayload(result)
  };
}

function normalizeShippingStatus(status) {
  const value = String(status || "").replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).toLowerCase();
  const aliases = {
    pickingup: "picking_up",
    intransit: "in_transit",
    droppingoff: "dropping_off",
    returnintransit: "return_in_transit",
    couriernotfound: "courier_not_found"
  };
  return aliases[value.replaceAll("_", "")] || value || "unknown";
}

async function biteshipRequest(path, options = {}, config = getLogisticsConfig()) {
  const response = await fetch(`${BITESHIP_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      authorization: config.apiKey,
      "content-type": "application/json"
    },
    body: options.body ? JSON.stringify(removeUndefined(options.body)) : undefined,
    cache: "no-store"
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(result.error || result.message || `Biteship 请求失败（${response.status}）`);
  }
  return result;
}

function ensureReady(config) {
  if (!config.enabled) throw new Error("物流功能尚未启用，请配置 LOGISTICS_PROVIDER。");
  if (!config.ready) throw new Error("Biteship 或发货仓地址配置不完整，请先完成上线检查中的物流配置。");
}

function compactProviderPayload(result) {
  return {
    id: result.id || "",
    status: result.status || "",
    price: Number(result.price || 0),
    updatedAt: new Date().toISOString()
  };
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function removeUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== ""));
}
