import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { formatIdr } from "@/lib/format";
import { getAnalyticsEventRows, insertAnalyticsEventRow, isPostgresEnabled } from "@/lib/postgres";

const dataDir = path.join(process.cwd(), "data");
const eventsPath = path.join(dataDir, "analytics-events.json");
let analyticsWriteQueue = Promise.resolve();
const EVENT_NAMES = [
  "page_view",
  "hero_cta_click",
  "sticky_cta_click",
  "demo_click",
  "video_open",
  "video_play",
  "gift_click",
  "wa_click",
  "sticky_bar_impression",
  "scroll_depth",
  "checkout_open",
  "payment_method_select",
  "location_request",
  "location_success",
  "location_failed",
  "checkout_submit_attempt",
  "form_error",
  "order_created",
  "cod_submit",
  "payment_redirect",
  "payment_success",
  "order_status_changed",
  "api_error"
];

export async function getAnalyticsEvents() {
  if (isPostgresEnabled()) {
    return getAnalyticsEventRows();
  }
  return readJson(eventsPath, []);
}

export async function createAnalyticsEvent(input) {
  const now = new Date().toISOString();
  const event = normalizeEvent(input, now);
  if (isPostgresEnabled()) {
    await insertAnalyticsEventRow(event);
    return event;
  }
  const write = analyticsWriteQueue.then(async () => {
    const events = await getAnalyticsEvents();
    events.unshift(event);
    await writeJson(eventsPath, events.slice(0, 20000));
  });
  analyticsWriteQueue = write.catch(() => {});
  await write;
  return event;
}

export async function getAnalyticsSummary({ orders = [], products = [], days = 30, productSlug = "all" } = {}) {
  const since = new Date(Date.now() - Number(days || 30) * 24 * 60 * 60 * 1000);
  const events = (await getAnalyticsEvents()).filter((event) => inRange(event.createdAt, since) && matchesProduct(event.productSlug, productSlug));
  const scopedOrders = orders.filter((order) => inRange(order.createdAt, since) && matchesProduct(order.productSlug, productSlug));
  const sessions = unique(events.map((event) => event.sessionId).filter(Boolean));
  const visitors = unique(events.map((event) => event.visitorId).filter(Boolean));
  const pageViews = countEvents(events, "page_view");
  const checkoutOpens = countEvents(events, "checkout_open");
  const orderCreated = Math.max(countUniqueEventOrders(events, "order_created"), scopedOrders.length);
  const paidOrConfirmed = scopedOrders.filter((order) => ["paid", "cod_confirmed"].includes(order.status)).length;
  const codOrders = scopedOrders.filter((order) => order.paymentMethod === "cod").length;
  const vaOrders = scopedOrders.filter((order) => order.paymentMethod === "virtual_account").length;
  const revenue = scopedOrders.filter((order) => ["paid", "cod_confirmed", "cod_pending"].includes(order.status)).reduce((sum, order) => sum + Number(order.total || 0), 0);

  return {
    days: Number(days || 30),
    productSlug,
    products,
    totals: {
      events: events.length,
      pageViews,
      visitors: visitors.length,
      sessions: sessions.length,
      orders: scopedOrders.length,
      revenue,
      revenueText: formatIdr(revenue),
      checkoutRate: rate(checkoutOpens, pageViews),
      orderRate: rate(orderCreated, pageViews),
      submitRate: rate(orderCreated, checkoutOpens),
      paidRate: rate(paidOrConfirmed, orderCreated),
      codShare: rate(codOrders, scopedOrders.length),
      vaShare: rate(vaOrders, scopedOrders.length)
    },
    funnel: [
      funnelStep("页面访问", pageViews, pageViews),
      funnelStep("点击购买", countEvents(events, "hero_cta_click") + countEvents(events, "sticky_cta_click"), pageViews),
      funnelStep("打开结账", checkoutOpens, pageViews),
      funnelStep("提交尝试", countEvents(events, "checkout_submit_attempt"), checkoutOpens),
      funnelStep("订单创建", orderCreated, checkoutOpens),
      funnelStep("已支付/已确认", paidOrConfirmed, orderCreated)
    ],
    engagement: [
      metric("视频点击", countEvents(events, "demo_click")),
      metric("视频打开", countEvents(events, "video_open")),
      metric("视频播放", countEvents(events, "video_play")),
      metric("赠品点击", countEvents(events, "gift_click")),
      metric("客服点击", countEvents(events, "wa_click")),
      metric("滚动 25%", countScroll(events, 25)),
      metric("滚动 50%", countScroll(events, 50)),
      metric("滚动 75%", countScroll(events, 75)),
      metric("滚动 100%", countScroll(events, 100))
    ],
    payment: groupOrders(scopedOrders, (order) => order.paymentMethod || "unknown"),
    sources: groupBySource(events, scopedOrders),
    formErrors: groupEvents(events.filter((event) => event.name === "form_error"), (event) => event.payload?.field || "unknown"),
    regions: groupOrders(scopedOrders, (order) => order.customer?.province || order.province || "未知地区"),
    devices: groupEvents(events, (event) => event.device?.type || "unknown"),
    recentEvents: events.slice(0, 20)
  };
}

function normalizeEvent(input, now) {
  const payload = sanitizePayload(input.payload || {});
  const name = EVENT_NAMES.includes(input.name) || input.name?.startsWith("scroll_depth_") ? input.name : "custom";
  return {
    id: `evt_${randomUUID()}`,
    name,
    productId: safeString(input.productId),
    productSlug: safeString(input.productSlug),
    visitorId: safeString(input.visitorId),
    sessionId: safeString(input.sessionId),
    orderId: safeString(input.orderId),
    paymentMethod: safeString(input.paymentMethod),
    value: Number(input.value || 0),
    pageUrl: safeString(input.pageUrl),
    path: safeString(input.path),
    referrer: safeString(input.referrer),
    firstAttribution: sanitizeAttribution(input.firstAttribution),
    lastAttribution: sanitizeAttribution(input.lastAttribution),
    city: safeString(input.city),
    province: safeString(input.province),
    device: sanitizeDevice(input.device),
    payload,
    createdAt: now
  };
}

function sanitizePayload(payload) {
  const blocked = new Set(["name", "phone", "address", "customer", "postalCode", "displayName"]);
  const output = {};
  for (const [key, value] of Object.entries(payload || {})) {
    if (blocked.has(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      output[key] = value;
    }
  }
  return output;
}

function sanitizeAttribution(value) {
  const output = {};
  for (const [key, item] of Object.entries(value || {})) {
    if (key.startsWith("utm_") || ["fbclid", "ttclid", "gclid"].includes(key)) {
      output[key] = safeString(item);
    }
  }
  return output;
}

function sanitizeDevice(device) {
  return {
    type: safeString(device?.type || "unknown"),
    viewportWidth: Number(device?.viewportWidth || 0),
    viewportHeight: Number(device?.viewportHeight || 0),
    userAgent: safeString(device?.userAgent).slice(0, 220),
    language: safeString(device?.language)
  };
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    if (error instanceof SyntaxError) {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(dataDir, { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}`;
  await fs.writeFile(tempPath, JSON.stringify(value, null, 2));
  await fs.rename(tempPath, filePath);
}

function countEvents(events, name) {
  return events.filter((event) => event.name === name).length;
}

function countUniqueEventOrders(events, name) {
  const matching = events.filter((event) => event.name === name);
  const orderIds = unique(matching.map((event) => event.orderId).filter(Boolean));
  return orderIds.length || matching.length;
}

function countScroll(events, depth) {
  return events.filter((event) => event.name === "scroll_depth" && Number(event.payload?.depth) >= depth).length;
}

function groupEvents(events, getKey) {
  const map = new Map();
  for (const event of events) {
    const key = getKey(event);
    const current = map.get(key) || { label: key, events: 0, sessions: new Set(), orders: 0, revenue: 0 };
    current.events += 1;
    if (event.sessionId) current.sessions.add(event.sessionId);
    map.set(key, current);
  }
  return [...map.values()]
    .map((item) => ({ ...item, sessions: item.sessions.size }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 12);
}

function groupOrders(orders, getKey) {
  const map = new Map();
  for (const order of orders) {
    const key = getKey(order);
    const current = map.get(key) || { label: key, orders: 0, revenue: 0, cod: 0, paid: 0 };
    current.orders += 1;
    current.revenue += Number(order.total || 0);
    if (order.paymentMethod === "cod") current.cod += 1;
    if (["paid", "cod_confirmed"].includes(order.status)) current.paid += 1;
    map.set(key, current);
  }
  return [...map.values()]
    .map((item) => ({ ...item, revenueText: formatIdr(item.revenue), codShare: rate(item.cod, item.orders), paidRate: rate(item.paid, item.orders) }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 12);
}

function groupBySource(events, orders) {
  const map = new Map();
  for (const event of events) {
    const key = sourceLabel(event.lastAttribution || event.firstAttribution);
    const current = map.get(key) || { label: key, visits: 0, sessions: new Set(), orders: 0, revenue: 0, cod: 0 };
    if (event.name === "page_view") current.visits += 1;
    if (event.sessionId) current.sessions.add(event.sessionId);
    map.set(key, current);
  }

  for (const order of orders) {
    const key = sourceLabel(order.utm);
    const current = map.get(key) || { label: key, visits: 0, sessions: new Set(), orders: 0, revenue: 0, cod: 0 };
    current.orders += 1;
    current.revenue += Number(order.total || 0);
    if (order.paymentMethod === "cod") current.cod += 1;
    map.set(key, current);
  }

  return [...map.values()]
    .map((item) => ({
      ...item,
      sessions: item.sessions.size,
      conversionRate: rate(item.orders, item.visits || item.sessions.size),
      codShare: rate(item.cod, item.orders),
      revenueText: formatIdr(item.revenue)
    }))
    .sort((a, b) => b.orders - a.orders || b.visits - a.visits)
    .slice(0, 12);
}

function sourceLabel(utm = {}) {
  if (utm?.utm_source) return `${utm.utm_source}${utm.utm_campaign ? ` / ${utm.utm_campaign}` : ""}`;
  if (utm?.ttclid) return "tiktok";
  if (utm?.fbclid) return "meta";
  if (utm?.gclid) return "google";
  if (utm?.utm_campaign) return utm.utm_campaign;
  return "direct/unknown";
}

function funnelStep(label, value, base) {
  return { label, value, rate: rate(value, base) };
}

function metric(label, value) {
  return { label, value };
}

function rate(value, base) {
  if (!base) return "0%";
  return `${Math.round((Number(value || 0) / Number(base || 1)) * 1000) / 10}%`;
}

function inRange(value, since) {
  return value && new Date(value) >= since;
}

function matchesProduct(value, productSlug) {
  return productSlug === "all" || value === productSlug;
}

function unique(values) {
  return [...new Set(values)];
}

function safeString(value) {
  return String(value || "").slice(0, 500);
}
