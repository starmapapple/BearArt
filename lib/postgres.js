import pg from "pg";

const { Pool } = pg;
let initialized = false;

export function isPostgresEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

export async function query(sql, params = []) {
  if (!isPostgresEnabled()) {
    throw new Error("DATABASE_URL is not configured.");
  }
  await ensureDatabase();
  return getPool().query(sql, params);
}

export async function insertProductRow(product) {
  await query(
    `insert into products (id, slug, status, preview_token, title, data, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
     on conflict (id) do update set
       slug = excluded.slug,
       status = excluded.status,
       preview_token = excluded.preview_token,
       title = excluded.title,
       data = excluded.data,
       updated_at = excluded.updated_at`,
    [product.id, product.slug, product.status, product.previewToken, product.title, JSON.stringify(product), product.createdAt, product.updatedAt]
  );
}

export async function getProductRows() {
  const result = await query("select data from products order by updated_at desc");
  return result.rows.map((row) => row.data);
}

export async function getProductRowById(id) {
  const result = await query("select data from products where id = $1 limit 1", [id]);
  return result.rows[0]?.data || null;
}

export async function insertOrderRow(order) {
  await query(
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
      payment_provider = excluded.payment_provider,
      payment_reference = excluded.payment_reference,
      status = excluded.status,
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
      order.variant,
      order.quantity,
      order.currency,
      order.unitPrice,
      order.total,
      order.paymentMethod,
      order.paymentProvider,
      order.paymentReference,
      order.status,
      JSON.stringify(order.customer || {}),
      JSON.stringify(order.location || {}),
      JSON.stringify(order.utm || {}),
      JSON.stringify(order.analytics || {}),
      order.pageUrl,
      JSON.stringify(order.events || []),
      order.createdAt,
      order.updatedAt
    ]
  );
}

export async function getOrderRows() {
  const result = await query("select * from orders order by created_at desc");
  return result.rows.map(orderFromRow);
}

export async function getOrderRowById(id) {
  const result = await query("select * from orders where id = $1 limit 1", [id]);
  return result.rows[0] ? orderFromRow(result.rows[0]) : null;
}

export async function insertAnalyticsEventRow(event) {
  await query(
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
      event.productId,
      event.productSlug,
      event.visitorId,
      event.sessionId,
      event.orderId,
      event.paymentMethod,
      event.value,
      event.pageUrl,
      event.path,
      event.referrer,
      JSON.stringify(event.firstAttribution || {}),
      JSON.stringify(event.lastAttribution || {}),
      event.city,
      event.province,
      JSON.stringify(event.device || {}),
      JSON.stringify(event.payload || {}),
      event.createdAt
    ]
  );
}

export async function getAnalyticsEventRows() {
  const result = await query("select * from analytics_events order by created_at desc limit 20000");
  return result.rows.map(analyticsEventFromRow);
}

export async function insertAuditLogRow(log) {
  await query(
    `insert into audit_logs (id, action, entity_type, entity_id, summary, details, created_at)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7)
     on conflict (id) do nothing`,
    [log.id, log.action, log.entityType, log.entityId, log.summary, JSON.stringify(log.details || {}), log.createdAt]
  );
}

export async function getAuditLogRows(limit = 200) {
  const result = await query(
    "select * from audit_logs order by created_at desc limit $1",
    [Math.min(Math.max(Number(limit) || 200, 1), 1000)]
  );
  return result.rows.map(auditLogFromRow);
}

function getPool() {
  if (!globalThis.__beartPgPool) {
    globalThis.__beartPgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
    });
  }
  return globalThis.__beartPgPool;
}

async function ensureDatabase() {
  if (initialized) return;
  initialized = true;
  const pool = getPool();
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

    create table if not exists audit_logs (
      id text primary key,
      action text not null,
      entity_type text not null,
      entity_id text,
      summary text not null,
      details jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
  `);
}

function orderFromRow(row) {
  return {
    id: row.id,
    productId: row.product_id,
    productSlug: row.product_slug,
    productTitle: row.product_title,
    variant: row.variant,
    quantity: row.quantity,
    currency: row.currency,
    unitPrice: row.unit_price,
    total: row.total,
    paymentMethod: row.payment_method,
    paymentProvider: row.payment_provider,
    paymentReference: row.payment_reference,
    status: row.status,
    customer: row.customer || {},
    location: row.location || {},
    utm: row.utm || {},
    analytics: row.analytics || {},
    pageUrl: row.page_url || "",
    events: row.events || [],
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    updatedAt: row.updated_at?.toISOString?.() || row.updated_at
  };
}

function analyticsEventFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    productId: row.product_id || "",
    productSlug: row.product_slug || "",
    visitorId: row.visitor_id || "",
    sessionId: row.session_id || "",
    orderId: row.order_id || "",
    paymentMethod: row.payment_method || "",
    value: row.value || 0,
    pageUrl: row.page_url || "",
    path: row.path || "",
    referrer: row.referrer || "",
    firstAttribution: row.first_attribution || {},
    lastAttribution: row.last_attribution || {},
    city: row.city || "",
    province: row.province || "",
    device: row.device || {},
    payload: row.payload || {},
    createdAt: row.created_at?.toISOString?.() || row.created_at
  };
}

function auditLogFromRow(row) {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id || "",
    summary: row.summary,
    details: row.details || {},
    createdAt: row.created_at?.toISOString?.() || row.created_at
  };
}
