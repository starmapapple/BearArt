"use client";

const VISITOR_KEY = "beart_analytics_visitor_id";
const SESSION_KEY = "beart_analytics_session";
const FIRST_ATTRIBUTION_KEY = "beart_analytics_first_attribution";
const LAST_ATTRIBUTION_KEY = "beart_analytics_last_attribution";
const SESSION_TTL = 30 * 60 * 1000;
const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "ttclid", "gclid"];

export function getAnalyticsContext() {
  if (typeof window === "undefined") return {};

  const now = Date.now();
  const visitorId = getOrCreateVisitorId();
  const session = getOrCreateSession(now);
  const attribution = updateAttribution();

  return {
    visitorId,
    sessionId: session.id,
    firstAttribution: attribution.first,
    lastAttribution: attribution.last
  };
}

export function getAttribution() {
  const context = getAnalyticsContext();
  return context.lastAttribution || {};
}

export function trackEvent(name, payload = {}) {
  if (typeof window === "undefined" || !name) return;

  const context = getAnalyticsContext();
  const event = {
    name,
    productId: payload.productId,
    productSlug: payload.productSlug,
    orderId: payload.orderId,
    paymentMethod: payload.paymentMethod,
    value: payload.value,
    city: payload.city,
    province: payload.province,
    visitorId: context.visitorId,
    sessionId: context.sessionId,
    firstAttribution: context.firstAttribution,
    lastAttribution: context.lastAttribution,
    pageUrl: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer || "",
    device: getDeviceSnapshot(),
    payload: sanitizePayload(payload.payload || payload)
  };

  if (window.dataLayer) {
    window.dataLayer.push({
      event: name,
      productId: event.productId,
      productSlug: event.productSlug,
      orderId: event.orderId,
      paymentMethod: event.paymentMethod,
      value: event.value
    });
  }

  const body = JSON.stringify(event);
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/events", blob);
    return;
  }

  fetch("/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true
  }).catch(() => {});
}

function getOrCreateVisitorId() {
  const current = window.localStorage.getItem(VISITOR_KEY);
  if (current) return current;

  const next = createId("vis");
  window.localStorage.setItem(VISITOR_KEY, next);
  return next;
}

function getOrCreateSession(now) {
  try {
    const current = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || "null");
    if (current?.id && now - Number(current.updatedAt || 0) < SESSION_TTL) {
      const next = { ...current, updatedAt: now };
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    }
  } catch {}

  const next = { id: createId("ses"), createdAt: now, updatedAt: now };
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

function updateAttribution() {
  const fromUrl = attributionFromUrl();
  const first = readJson(FIRST_ATTRIBUTION_KEY) || fromUrl || {};
  const last = fromUrl || readJson(LAST_ATTRIBUTION_KEY) || first || {};

  if (fromUrl && Object.keys(fromUrl).length) {
    if (!readJson(FIRST_ATTRIBUTION_KEY)) {
      window.localStorage.setItem(FIRST_ATTRIBUTION_KEY, JSON.stringify(fromUrl));
    }
    window.localStorage.setItem(LAST_ATTRIBUTION_KEY, JSON.stringify(fromUrl));
  }

  return { first, last };
}

function attributionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const value = {};
  for (const key of ATTRIBUTION_KEYS) {
    const item = params.get(key);
    if (item) value[key] = item;
  }
  return Object.keys(value).length ? value : null;
}

function readJson(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function getDeviceSnapshot() {
  const width = window.innerWidth || 0;
  return {
    type: width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop",
    viewportWidth: width,
    viewportHeight: window.innerHeight || 0,
    userAgent: navigator.userAgent || "",
    language: navigator.language || ""
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

function createId(prefix) {
  const id = crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${id}`;
}
