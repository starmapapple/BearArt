import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const root = process.cwd();
const publicDir = path.join(root, "public");
const uploadsDir = path.join(publicDir, "uploads");
const productsPath = path.join(root, "data", "products.json");
const assetExtensions = new Set([".avif", ".gif", ".jpg", ".jpeg", ".mp4", ".png", ".svg", ".webm", ".webp"]);

const files = await walk(uploadsDir);
const renameMap = new Map();

for (const filePath of files) {
  const extension = path.extname(filePath).toLowerCase();
  if (!assetExtensions.has(extension)) continue;

  const fileName = path.basename(filePath);
  const cleanName = cleanAssetFileName(fileName);
  if (cleanName === fileName) continue;

  const targetPath = await getAvailableTargetPath(path.dirname(filePath), cleanName);
  await fs.rename(filePath, targetPath);

  const oldUrl = toPublicUrl(filePath);
  const newUrl = toPublicUrl(targetPath);
  renameMap.set(oldUrl, newUrl);
}

if (renameMap.size) {
  const localChanged = await replaceLocalProducts(renameMap);
  const dbChanged = await replacePostgresProducts(renameMap);

  console.log(`Renamed ${renameMap.size} assets.`);
  console.log(`Updated local products: ${localChanged}.`);
  console.log(`Updated Postgres products: ${dbChanged}.`);
  for (const [from, to] of renameMap.entries()) {
    console.log(`${from} -> ${to}`);
  }
} else {
  console.log("No generated long asset filenames found.");
}

async function walk(dir) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return entry.isFile() ? [fullPath] : [];
    })
  );

  return files.flat();
}

function cleanAssetFileName(fileName) {
  const extension = path.extname(fileName);
  let base = path.basename(fileName, extension);
  const originalBase = base;

  base = base
    .replace(/^\d+-/, "")
    .replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "")
    .replace(/-(high|balanced|small)-compressed-\1$/i, "-$1")
    .replace(/-compressed-(high|balanced|small)$/i, "-$1")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base === originalBase) return fileName;
  return `${base || originalBase}${extension.toLowerCase()}`;
}

async function getAvailableTargetPath(dir, fileName) {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);
  let candidate = path.join(dir, fileName);
  let index = 2;

  while (true) {
    try {
      await fs.access(candidate);
      candidate = path.join(dir, `${baseName}-${index}${extension}`);
      index += 1;
    } catch {
      return candidate;
    }
  }
}

function toPublicUrl(filePath) {
  return `/${path.relative(publicDir, filePath).split(path.sep).join("/")}`;
}

async function replaceLocalProducts(map) {
  let products;
  try {
    products = JSON.parse(await fs.readFile(productsPath, "utf8"));
  } catch {
    return 0;
  }

  const { value, changed } = replaceValue(products, map);
  if (!changed) return 0;
  await fs.writeFile(productsPath, `${JSON.stringify(value, null, 2)}\n`);
  return changed;
}

async function replacePostgresProducts(map) {
  if (!process.env.DATABASE_URL) return 0;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query("select id, data from products");
    let changedProducts = 0;

    for (const row of result.rows) {
      const { value, changed } = replaceValue(row.data, map);
      if (!changed) continue;
      value.updatedAt = new Date().toISOString();
      await pool.query(
        `update products
         set data = $2::jsonb, title = $3, status = $4, slug = $5, preview_token = $6, updated_at = $7
         where id = $1`,
        [
          row.id,
          JSON.stringify(value),
          value.title || "Untitled product",
          value.status || "draft",
          value.slug,
          value.previewToken || "",
          value.updatedAt
        ]
      );
      changedProducts += 1;
    }

    return changedProducts;
  } catch (error) {
    console.warn(`Skipped Postgres update: ${error.message}`);
    return 0;
  } finally {
    await pool.end();
  }
}

function replaceValue(value, map) {
  if (typeof value === "string") {
    return map.has(value) ? { value: map.get(value), changed: 1 } : { value, changed: 0 };
  }

  if (Array.isArray(value)) {
    let changed = 0;
    const next = value.map((item) => {
      const result = replaceValue(item, map);
      changed += result.changed;
      return result.value;
    });
    return { value: next, changed };
  }

  if (value && typeof value === "object") {
    let changed = 0;
    const next = {};
    for (const [key, item] of Object.entries(value)) {
      const result = replaceValue(item, map);
      changed += result.changed;
      next[key] = result.value;
    }
    return { value: next, changed };
  }

  return { value, changed: 0 };
}
