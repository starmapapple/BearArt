import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const root = process.cwd();
const dataDir = path.join(root, "data");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
});

await ensureDatabase();
const products = await readJson("products.json", []);
const orders = await readJson("orders.json", []);
const events = await readJson("analytics-events.json", []);

for (const product of products) {
  await pool.query(
    `insert into products (id, slug, status, preview_token, title, data, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
     on conflict (id) do update set
       slug = excluded.slug,
       status = excluded.status,
       preview_token = excluded.preview_token,
       title = excluded.title,
       data = excluded.data,
       updated_at = excluded.updated_at`,
    [
      product.id,
      product.slug,
      product.status || "draft",
      product.previewToken || "",
      product.title || "Untitled product",
      JSON.stringify(product),
      product.createdAt || new Date().toISOString(),
      product.updatedAt || new Date().toISOString()
    ]
  );
}

for (const order of orders) {
  await pool.query(
    `insert into orders (
      id, product_id, product_slug, product_title, variant, quantity, currency, unit_price, total,
      payment_method, payment_provider, payment_reference, status, customer, location, utm, analytics,
      page_url, events, created_at, updated_at
    ) values (
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb,
      $18, $19::jsonb, $20, $21
    )
    on conflict (id) do update set
      status = excluded.status,
      payment_provider = excluded.payment_provider,
      payment_reference = excluded.payment_reference,
      customer = excluded.customer,
      location = excluded.location,
      utm = excluded.utm,
      analytics = excluded.analytics,
      events = excluded.events,
      updated_at = excluded.updated_at`,
    [
      order.id,
      order.productId,
      order.productSlug,
      order.productTitle,
      order.variant || "",
      order.quantity || 1,
      order.currency || "IDR",
      order.unitPrice || 0,
      order.total || 0,
      order.paymentMethod,
      order.paymentProvider || "",
      order.paymentReference || "",
      order.status,
      JSON.stringify(order.customer || {}),
      JSON.stringify(order.location || {}),
      JSON.stringify(order.utm || {}),
      JSON.stringify(order.analytics || {}),
      order.pageUrl || "",
      JSON.stringify(order.events || []),
      order.createdAt || new Date().toISOString(),
      order.updatedAt || order.createdAt || new Date().toISOString()
    ]
  );
}

for (const event of events) {
  await pool.query(
    `insert into analytics_events (
      id, name, product_id, product_slug, visitor_id, session_id, order_id, payment_method, value,
      page_url, path, referrer, first_attribution, last_attribution, city, province, device, payload, created_at
    ) values (
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      $10, $11, $12, $13::jsonb, $14::jsonb, $15, $16, $17::jsonb, $18::jsonb, $19
    )
    on conflict (id) do nothing`,
    [
      event.id,
      event.name,
      event.productId || "",
      event.productSlug || "",
      event.visitorId || "",
      event.sessionId || "",
      event.orderId || "",
      event.paymentMethod || "",
      event.value || 0,
      event.pageUrl || "",
      event.path || "",
      event.referrer || "",
      JSON.stringify(event.firstAttribution || {}),
      JSON.stringify(event.lastAttribution || {}),
      event.city || "",
      event.province || "",
      JSON.stringify(event.device || {}),
      JSON.stringify(event.payload || {}),
      event.createdAt || new Date().toISOString()
    ]
  );
}

await pool.end();
console.log(`Migrated ${products.length} products, ${orders.length} orders, ${events.length} analytics events.`);

async function readJson(fileName, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(dataDir, fileName), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function ensureDatabase() {
  await pool.query(`
    create table if not exists products (
      id text primary key,
      slug text unique not null,
      status text not null default 'draft',
      preview_token text,
      title text not null,
      data jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists orders (
      id text primary key,
      product_id text not null,
      product_slug text not null,
      product_title text not null,
      variant text,
      quantity integer not null default 1,
      currency text not null default 'IDR',
      unit_price integer not null default 0,
      total integer not null default 0,
      payment_method text not null,
      payment_provider text,
      payment_reference text,
      status text not null,
      customer jsonb not null default '{}'::jsonb,
      location jsonb not null default '{}'::jsonb,
      utm jsonb not null default '{}'::jsonb,
      analytics jsonb not null default '{}'::jsonb,
      page_url text,
      events jsonb not null default '[]'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists analytics_events (
      id text primary key,
      name text not null,
      product_id text,
      product_slug text,
      visitor_id text,
      session_id text,
      order_id text,
      payment_method text,
      value integer not null default 0,
      page_url text,
      path text,
      referrer text,
      first_attribution jsonb not null default '{}'::jsonb,
      last_attribution jsonb not null default '{}'::jsonb,
      city text,
      province text,
      device jsonb not null default '{}'::jsonb,
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
  `);
}
