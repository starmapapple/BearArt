import path from "node:path";
import { NextResponse } from "next/server";
import { getAssetFamilyKey, normalizeAssetPath, resolvePublicAssetPath } from "@/lib/adminAssets";
import { writeAuditLog } from "@/lib/auditLog";
import { getProducts, updateProduct } from "@/lib/store";

const imageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".avif"];

export async function POST(request) {
  try {
    const { path: assetPath, targetPath } = await request.json();
    const { normalized } = resolvePublicAssetPath(assetPath);
    const products = await getProducts();
    const familyKey = getAssetFamilyKey(normalized);
    const target = targetPath ? normalizeAssetPath(targetPath) : "";

    if (!familyKey) {
      return NextResponse.json({ error: "没有找到这个素材的版本组。" }, { status: 404 });
    }

    const changedProducts = [];
    const changedFrom = new Set();

    for (const product of products) {
      const result = target
        ? replaceAssetUrl(product, target, normalized)
        : replaceAssetFamily(product, familyKey, normalized);
      const { value, changed, from } = result;
      if (!changed) continue;
      await updateProduct(product.id, value);
      changedProducts.push(product.title || product.slug || product.id);
      from?.forEach((url) => changedFrom.add(url));
    }

    if (!changedProducts.length) {
      return NextResponse.json({ error: "当前没有可切换的引用，可能这个素材已经是应用状态。" }, { status: 404 });
    }

    await writeAuditLog({
      action: "asset_applied",
      entityType: "asset",
      entityId: normalized,
      summary: "切换落地页应用素材",
      details: {
        from: Array.from(changedFrom),
        to: normalized,
        products: changedProducts
      }
    });

    return NextResponse.json({
      ok: true,
      from: Array.from(changedFrom),
      to: normalized,
      changedProducts
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "应用素材失败。" }, { status: 400 });
  }
}

function replaceAssetFamily(value, familyKey, nextPath) {
  let changed = false;
  const from = new Set();

  const replaced = visit(value);
  return { value: replaced, changed, from };

  function visit(item) {
    if (typeof item === "string") {
      const next = replaceFamilyString(item, familyKey, nextPath, from);
      if (next !== item) changed = true;
      return next;
    }

    if (Array.isArray(item)) {
      return item.map(visit);
    }

    if (item && typeof item === "object") {
      return Object.fromEntries(Object.entries(item).map(([key, child]) => [key, visit(child)]));
    }

    return item;
  }
}

function inferOriginalAssetPath(assetPath, products) {
  const folder = path.posix.dirname(assetPath);
  const base = originalBaseNameFromCompressed(path.posix.basename(assetPath, path.posix.extname(assetPath)));
  const productText = JSON.stringify(products);

  for (const extension of imageExtensions) {
    const candidate = `${folder}/${base}${extension}`;
    if (candidate !== assetPath && productText.includes(candidate)) return candidate;
  }

  return "";
}

function originalBaseNameFromCompressed(fileBaseName) {
  return fileBaseName
    .replace(/^\d+-/, "")
    .replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "")
    .replace(/-compressed-(high|balanced|small)$/i, "")
    .replace(/-(high|balanced|small)$/i, "");
}

function replaceAssetUrl(value, targetPath, nextPath) {
  let changed = false;
  const from = new Set();

  const replaced = visit(value);
  return { value: replaced, changed, from };

  function visit(item) {
    if (typeof item === "string") {
      const next = replaceString(item, targetPath, nextPath);
      if (next !== item) {
        changed = true;
        from.add(targetPath);
      }
      return next;
    }

    if (Array.isArray(item)) {
      return item.map(visit);
    }

    if (item && typeof item === "object") {
      return Object.fromEntries(Object.entries(item).map(([key, child]) => [key, visit(child)]));
    }

    return item;
  }
}

function replaceString(value, targetPath, nextPath) {
  if (value === targetPath) return nextPath;
  if (value.startsWith(`${targetPath}?`)) return `${nextPath}${value.slice(targetPath.length)}`;
  return value;
}

function replaceFamilyString(value, familyKey, nextPath, from) {
  const text = String(value || "");
  const [pathPart] = text.split("?");

  if (!pathPart.startsWith("/")) return value;

  try {
    const normalized = normalizeAssetPath(pathPart);
    if (normalized === nextPath) return value;
    if (getAssetFamilyKey(normalized) !== familyKey) return value;
    from.add(normalized);
    return `${nextPath}${text.slice(pathPart.length)}`;
  } catch {
    return value;
  }
}
