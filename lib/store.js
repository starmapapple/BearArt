import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { applyColorBearDefaults } from "@/lib/colorbearDefaults";
import { formatIdr } from "@/lib/format";
import {
  deleteProductRow,
  getOrderRowById,
  getOrderRows,
  getProductRowById,
  getProductRows,
  insertOrderRow,
  insertProductRow,
  isPostgresEnabled
} from "@/lib/postgres";

const dataDir = path.join(process.cwd(), "data");
const productsPath = path.join(dataDir, "products.json");
const ordersPath = path.join(dataDir, "orders.json");

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
    throw error;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2));
}

export async function getProducts() {
  if (isPostgresEnabled()) {
    return (await getProductRows()).map(normalizeProduct).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }
  const products = await readJson(productsPath, []);
  return products.map(normalizeProduct).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function getProductBySlug(slug) {
  const products = await getProducts();
  return products.find((product) => product.slug === slug) || null;
}

export async function getProductById(id) {
  if (isPostgresEnabled()) {
    const product = await getProductRowById(id);
    return product ? normalizeProduct(product) : null;
  }
  const products = await getProducts();
  return products.find((product) => product.id === id) || null;
}

export async function createProduct(input) {
  const products = await getProducts();
  const now = new Date().toISOString();
  const product = normalizeProduct({
    ...input,
    id: `prod_${randomUUID()}`,
    previewToken: randomUUID(),
    createdAt: now,
    updatedAt: now
  });

  ensureUniqueSlug(products, product.slug);
  if (isPostgresEnabled()) {
    await insertProductRow(product);
    return product;
  }
  products.unshift(product);
  await writeJson(productsPath, products);
  return product;
}

export async function updateProduct(id, input) {
  const products = await getProducts();
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return null;

  const candidate = normalizeProduct({
    ...products[index],
    ...input,
    id,
    updatedAt: new Date().toISOString()
  });

  ensureUniqueSlug(products.filter((product) => product.id !== id), candidate.slug);
  if (isPostgresEnabled()) {
    await insertProductRow(candidate);
    return candidate;
  }
  products[index] = candidate;
  await writeJson(productsPath, products);
  return candidate;
}

export async function deleteProduct(id) {
  const products = await getProducts();
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return null;

  const [deletedProduct] = products.splice(index, 1);
  if (isPostgresEnabled()) {
    await deleteProductRow(id);
    return deletedProduct;
  }

  await writeJson(productsPath, products);
  return deletedProduct;
}

export async function getOrders() {
  if (isPostgresEnabled()) {
    return getOrderRows();
  }
  const orders = await readJson(ordersPath, []);
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getOrderById(id) {
  if (isPostgresEnabled()) {
    return getOrderRowById(id);
  }
  const orders = await getOrders();
  return orders.find((order) => order.id === id) || null;
}

export async function findCustomerOrders({ phone, orderId }) {
  const orders = await getOrders();
  const cleanPhone = normalizePhone(phone);
  const cleanOrderId = String(orderId || "").trim();

  return orders.filter((order) => {
    const matchesOrder = cleanOrderId && order.id.toLowerCase() === cleanOrderId.toLowerCase();
    const matchesPhone = cleanPhone && normalizePhone(order.customer?.phone).endsWith(cleanPhone);
    return matchesOrder || matchesPhone;
  });
}

export async function createOrder(input) {
  const product = await getProductById(input.productId);
  if (!product || product.status !== "published") {
    throw new Error("当前商品暂不可购买。");
  }

  const quantity = Math.max(1, Number(input.quantity || 1));
  const now = new Date().toISOString();
  const allowedPaymentMethods = normalizeArray(product.paymentMethods).length ? normalizeArray(product.paymentMethods) : ["cod"];
  const paymentMethod = input.paymentMethod || allowedPaymentMethods[0] || "cod";
  if (!allowedPaymentMethods.includes(paymentMethod)) {
    throw new Error("当前支付方式不可用，请重新选择。");
  }
  if (paymentMethod === "cod" && product.codEnabled === false) {
    throw new Error("当前商品暂未开启 COD。");
  }
  const status = paymentMethod === "cod" ? "cod_pending" : "awaiting_payment";
  const order = {
    id: `ord_${randomUUID()}`,
    productId: product.id,
    productSlug: product.slug,
    productTitle: product.title,
    variant: input.variant || product.variants?.[0] || "",
    quantity,
    currency: product.currency || "IDR",
    unitPrice: Number(product.price || 0),
    total: Number(product.price || 0) * quantity,
    paymentMethod,
    paymentProvider: paymentMethod === "cod" ? "cod" : "mock_gateway",
    paymentReference: "",
    status,
    customer: sanitizeCustomer(input.customer),
    location: sanitizeLocation(input.location),
    utm: input.utm || {},
    analytics: sanitizeAnalytics(input.analytics),
    pageUrl: input.pageUrl || "",
    events: [
      {
        at: now,
        type: "created",
        note: status
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  if (isPostgresEnabled()) {
    await insertOrderRow(order);
  } else {
    const orders = await getOrders();
    orders.unshift(order);
    await writeJson(ordersPath, orders);
  }
  return order;
}

function sanitizeAnalytics(analytics = {}) {
  return {
    visitorId: String(analytics.visitorId || "").slice(0, 120),
    sessionId: String(analytics.sessionId || "").slice(0, 120),
    firstAttribution: sanitizeAttribution(analytics.firstAttribution),
    lastAttribution: sanitizeAttribution(analytics.lastAttribution)
  };
}

function sanitizeAttribution(value = {}) {
  const output = {};
  for (const [key, item] of Object.entries(value || {})) {
    if (key.startsWith("utm_") || ["fbclid", "ttclid", "gclid"].includes(key)) {
      output[key] = String(item || "").slice(0, 300);
    }
  }
  return output;
}

export async function updateOrderStatus(id, status, details = {}) {
  if (isPostgresEnabled()) {
    const order = await getOrderRowById(id);
    if (!order) return null;
    const now = new Date().toISOString();
    const note = details.note || status;
    const next = {
      ...order,
      ...details,
      status,
      updatedAt: now,
      events: [
        ...(order.events || []),
        {
          at: now,
          type: "status_changed",
          note,
          status
        }
      ]
    };
    await insertOrderRow(next);
    return next;
  }

  const orders = await getOrders();
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const note = details.note || status;
  orders[index] = {
    ...orders[index],
    ...details,
    status,
    updatedAt: now,
    events: [
      ...(orders[index].events || []),
      {
        at: now,
        type: "status_changed",
        note,
        status
      }
    ]
  };
  await writeJson(ordersPath, orders);
  return orders[index];
}

export function ordersToCsv(orders) {
  const headers = [
    "order_id",
    "status",
    "payment_method",
    "product_slug",
    "product_title",
    "variant",
    "quantity",
    "total",
    "customer_name",
    "phone",
    "address",
    "city",
    "province",
    "postal_code",
    "latitude",
    "longitude",
    "utm_source",
    "utm_campaign",
    "visitor_id",
    "session_id",
    "created_at"
  ];

  const rows = orders.map((order) => [
    order.id,
    order.status,
    order.paymentMethod,
    order.productSlug,
    order.productTitle,
    order.variant,
    order.quantity,
    order.total,
    order.customer?.name,
    order.customer?.phone,
    order.customer?.address,
    order.customer?.city,
    order.customer?.province,
    order.customer?.postalCode,
    order.location?.lat,
    order.location?.lon,
    order.utm?.utm_source,
    order.utm?.utm_campaign,
    order.analytics?.visitorId,
    order.analytics?.sessionId,
    order.createdAt
  ]);

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function filterOrders(orders, filters = {}) {
  return orders.filter((order) => {
    if (filters.status && filters.status !== "all" && order.status !== filters.status) return false;
    if (filters.paymentMethod && filters.paymentMethod !== "all" && order.paymentMethod !== filters.paymentMethod) return false;
    if (filters.productSlug && filters.productSlug !== "all" && order.productSlug !== filters.productSlug) return false;
    if (filters.province && filters.province !== "all" && order.customer?.province !== filters.province) return false;
    if (filters.from && new Date(order.createdAt) < new Date(filters.from)) return false;
    if (filters.to) {
      const end = new Date(filters.to);
      end.setHours(23, 59, 59, 999);
      if (new Date(order.createdAt) > end) return false;
    }
    return true;
  });
}

export { formatIdr };

function normalizeProduct(product) {
  return applyColorBearDefaults({
    id: product.id,
    slug: slugify(product.slug || product.title || "product"),
    status: ["draft", "published", "archived"].includes(product.status) ? product.status : "draft",
    previewToken: product.previewToken || randomUUID(),
    title: product.title || "Untitled product",
    subtitle: product.subtitle || "",
    heroImage: product.heroImage || "",
    problemImage: product.problemImage || "",
    videoUrl: product.videoUrl || "",
    videoPoster: product.videoPoster || "",
    usageGuideImage: product.usageGuideImage || "",
    giftImages: normalizeArray(product.giftImages),
    gallery: normalizeArray(product.gallery),
    currency: product.currency || "IDR",
    price: Number(product.price || 0),
    compareAtPrice: Number(product.compareAtPrice || 0),
    variants: normalizeArray(product.variants),
    benefits: normalizeArray(product.benefits),
    sections: normalizeSections(product.sections),
    reviews: normalizeReviews(product.reviews),
    faqs: normalizeFaqs(product.faqs),
    ctaText: product.ctaText || "立即购买",
    codEnabled: Boolean(product.codEnabled),
    paymentMethods: normalizeArray(product.paymentMethods).length
      ? normalizeArray(product.paymentMethods)
      : ["cod"],
    pixels: {
      metaPixelId: product.pixels?.metaPixelId || "",
      tiktokPixelId: product.pixels?.tiktokPixelId || "",
      googleAdsId: product.pixels?.googleAdsId || ""
    },
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString()
  });
}

function sanitizeCustomer(customer = {}) {
  return {
    name: String(customer.name || "").trim(),
    phone: String(customer.phone || "").trim(),
    address: String(customer.address || "").trim(),
    city: String(customer.city || "").trim(),
    province: String(customer.province || "").trim(),
    postalCode: String(customer.postalCode || "").trim()
  };
}

function sanitizeLocation(location = {}) {
  if (!location || typeof location !== "object") {
    return {
      lat: null,
      lon: null,
      source: "",
      displayName: ""
    };
  }

  return {
    lat: Number.isFinite(Number(location.lat)) ? Number(location.lat) : null,
    lon: Number.isFinite(Number(location.lon)) ? Number(location.lon) : null,
    source: String(location.source || "").trim(),
    displayName: String(location.displayName || "").trim()
  };
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSections(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        heading: String(item.heading || "").trim(),
        body: String(item.body || "").trim()
      }))
      .filter((item) => item.heading || item.body);
  }
  return [];
}

function normalizeReviews(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        name: String(item.name || "").trim(),
        rating: Math.min(5, Math.max(1, Number(item.rating || 5))),
        text: String(item.text || "").trim(),
        avatar: String(item.avatar || "").trim(),
        gallery: normalizeArray(item.gallery)
      }))
      .filter((item) => item.name || item.text);
  }
  return [];
}

function normalizeFaqs(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        question: String(item.question || "").trim(),
        answer: String(item.answer || "").trim()
      }))
      .filter((item) => item.question || item.answer);
  }
  return [];
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function ensureUniqueSlug(products, slug) {
  if (!slug) throw new Error("Slug is required.");
  if (products.some((product) => product.slug === slug)) {
    throw new Error(`Slug "${slug}" already exists.`);
  }
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
