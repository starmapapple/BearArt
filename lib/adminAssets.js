import fs from "node:fs/promises";
import path from "node:path";

const publicDir = path.join(process.cwd(), "public");
const assetExtensions = new Set([
  ".avif",
  ".gif",
  ".jpg",
  ".jpeg",
  ".mp4",
  ".png",
  ".svg",
  ".webm",
  ".webp"
]);
const imageExtensions = new Set([".avif", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"]);
const videoExtensions = new Set([".mp4", ".webm"]);
const hardcodedReferences = {
  "/uploads/colorbear-art/hero.png": ["ColorBear 问题模块图片"],
  "/uploads/colorbear-art/usage-guide.png": ["ColorBear 使用说明图片"],
  "/icons/whatsapp-green.webp": ["客服 WhatsApp 图标"],
  "/icons/whatsapp.svg": ["客服 WhatsApp 图标"]
};

export async function getAdminAssets(products = []) {
  const files = await walkPublic(publicDir);
  const references = getAssetReferences(products);
  const assets = (await Promise.all(files.map(toAsset).filter(Boolean)))
    .filter(Boolean)
    .map((asset) => ({
      ...asset,
      references: references.get(asset.url) || [],
      referenceCount: references.get(asset.url)?.length || 0
    }));
  const familyMeta = getAssetFamilyMeta(assets);
  return assets.sort((a, b) => compareAssets(a, b, familyMeta));
}

function getAssetFamilyMeta(assets) {
  const meta = new Map();

  for (const asset of assets) {
    const key = asset.familyKey || asset.url;
    const current = meta.get(key) || { hasApplied: false, updatedAt: 0 };
    const updatedAt = new Date(asset.updatedAt).getTime() || 0;
    current.hasApplied = current.hasApplied || asset.referenceCount > 0;
    current.updatedAt = Math.max(current.updatedAt, updatedAt);
    meta.set(key, current);
  }

  return meta;
}

function compareAssets(a, b, familyMeta) {
  const aFamilyKey = a.familyKey || a.url;
  const bFamilyKey = b.familyKey || b.url;
  const aFamily = familyMeta.get(aFamilyKey) || {};
  const bFamily = familyMeta.get(bFamilyKey) || {};

  if (aFamilyKey !== bFamilyKey) {
    const appliedGroupOrder = Number(Boolean(bFamily.hasApplied)) - Number(Boolean(aFamily.hasApplied));
    if (appliedGroupOrder) return appliedGroupOrder;

    const updatedGroupOrder = (bFamily.updatedAt || 0) - (aFamily.updatedAt || 0);
    if (updatedGroupOrder) return updatedGroupOrder;

    return aFamilyKey.localeCompare(bFamilyKey);
  }

  const appliedOrder = Number(Boolean(b.referenceCount)) - Number(Boolean(a.referenceCount));
  if (appliedOrder) return appliedOrder;

  const variantOrder = getAssetVariantRank(a) - getAssetVariantRank(b);
  if (variantOrder) return variantOrder;

  const updatedOrder = (new Date(b.updatedAt).getTime() || 0) - (new Date(a.updatedAt).getTime() || 0);
  if (updatedOrder) return updatedOrder;

  return a.name.localeCompare(b.name);
}

function getAssetVariantRank(asset) {
  const id = asset.compression?.id || readCompressionPreset(asset.name)?.id || "";
  const ranks = {
    high: 1,
    balanced: 2,
    small: 3
  };
  return ranks[id] || 0;
}

export function resolvePublicAssetPath(assetPath) {
  const normalized = normalizeAssetPath(assetPath);
  const absolutePath = path.join(publicDir, normalized.slice(1));
  const relative = path.relative(publicDir, absolutePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("素材路径不合法。");
  }

  return { normalized, absolutePath };
}

export function normalizeAssetPath(assetPath) {
  const value = String(assetPath || "").trim();
  if (!value.startsWith("/")) throw new Error("素材路径必须以 / 开头。");
  if (value.includes("\0")) throw new Error("素材路径不合法。");
  return path.posix.normalize(value);
}

export function getAssetReferences(products = []) {
  const references = new Map();

  for (const [url, labels] of Object.entries(hardcodedReferences)) {
    for (const label of labels) addReference(references, url, label);
  }

  for (const product of products) {
    collectProductReferences(product).forEach((url) => {
      addReference(references, url, `${product.title || product.slug || "落地页"} /p/${product.slug || "-"}`);
    });
  }

  return references;
}

export function addReference(references, url, label) {
  const normalized = safeNormalizeLocalAssetUrl(url);
  if (!normalized) return;
  const current = references.get(normalized) || [];
  if (!current.includes(label)) current.push(label);
  references.set(normalized, current);
}

async function walkPublic(dir) {
  let entries = [];

  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walkPublic(fullPath);
      if (!entry.isFile()) return [];
      return [fullPath];
    })
  );

  return files.flat();
}

async function toAsset(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (!assetExtensions.has(extension)) return null;

  const stat = await fs.stat(filePath);
  const relative = path.relative(publicDir, filePath).split(path.sep).join("/");
  const url = `/${relative}`;
  const buffer = imageExtensions.has(extension) ? await fs.readFile(filePath) : null;
  const dimensions = buffer ? readImageDimensions(buffer, extension) : null;

  return {
    url,
    name: path.basename(filePath),
    folder: path.dirname(url) === "/" ? "/" : path.dirname(url),
    extension: extension.slice(1).toUpperCase(),
    type: videoExtensions.has(extension) ? "video" : "image",
    size: stat.size,
    sizeText: formatBytes(stat.size),
    width: dimensions?.width || null,
    height: dimensions?.height || null,
    dimensionsText: dimensions ? `${dimensions.width} x ${dimensions.height}` : "未识别",
    compression: readCompressionPreset(path.basename(filePath)),
    familyKey: getAssetFamilyKey(url),
    updatedAt: stat.mtime.toISOString()
  };
}

function collectProductReferences(product) {
  const urls = new Set();
  visit(product);
  return urls;

  function visit(value) {
    if (!value) return;
    if (typeof value === "string") {
      const normalized = safeNormalizeLocalAssetUrl(value);
      if (normalized) urls.add(normalized);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      Object.values(value).forEach(visit);
    }
  }
}

function safeNormalizeLocalAssetUrl(value) {
  const text = String(value || "").trim();
  if (!text.startsWith("/")) return null;
  if (!assetExtensions.has(path.extname(text.split("?")[0]).toLowerCase())) return null;
  try {
    return normalizeAssetPath(text.split("?")[0]);
  } catch {
    return null;
  }
}

function readCompressionPreset(fileName) {
  const matches = Array.from(fileName.matchAll(/(?:compressed-)?(high|balanced|small)(?:-|\.|$)/gi));
  const match = matches.at(-1);
  if (!match) return null;
  const labels = {
    high: "高清",
    balanced: "均衡",
    small: "极小"
  };
  return {
    id: match[1].toLowerCase(),
    label: labels[match[1].toLowerCase()]
  };
}

export function getAssetFamilyKey(assetPath) {
  const normalized = normalizeAssetPath(assetPath.split("?")[0]);
  const extension = path.posix.extname(normalized).toLowerCase();
  if (!assetExtensions.has(extension)) return "";
  const folder = path.posix.dirname(normalized);
  const base = normalizeAssetFamilyBase(path.posix.basename(normalized, extension));
  return `${folder}/${base}`;
}

function normalizeAssetFamilyBase(fileBaseName) {
  return fileBaseName
    .replace(/^\d+-/, "")
    .replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "")
    .replace(/-compressed-(high|balanced|small)$/i, "")
    .replace(/-(high|balanced|small)$/i, "");
}

function readImageDimensions(buffer, extension) {
  if (extension === ".png") return readPng(buffer);
  if (extension === ".jpg" || extension === ".jpeg") return readJpeg(buffer);
  if (extension === ".webp") return readWebp(buffer);
  if (extension === ".gif") return readGif(buffer);
  if (extension === ".svg") return readSvg(buffer);
  return null;
}

function readPng(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function readGif(buffer) {
  if (buffer.length < 10 || !["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) return null;
  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
}

function readJpeg(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    const isSof = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
    if (isSof && offset + 8 < buffer.length) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }
    offset += 2 + length;
  }

  return null;
}

function readWebp(buffer) {
  if (buffer.length < 30 || buffer.subarray(0, 4).toString("ascii") !== "RIFF" || buffer.subarray(8, 12).toString("ascii") !== "WEBP") {
    return null;
  }

  const chunk = buffer.subarray(12, 16).toString("ascii");
  if (chunk === "VP8X") {
    return {
      width: 1 + readUInt24LE(buffer, 24),
      height: 1 + readUInt24LE(buffer, 27)
    };
  }

  if (chunk === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    };
  }

  if (chunk === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: 1 + (bits & 0x3fff),
      height: 1 + ((bits >> 14) & 0x3fff)
    };
  }

  return null;
}

function readSvg(buffer) {
  const text = buffer.subarray(0, 4096).toString("utf8");
  const width = readSvgNumber(text, "width");
  const height = readSvgNumber(text, "height");
  if (width && height) return { width, height };

  const viewBox = text.match(/viewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  if (!viewBox) return null;
  return { width: Math.round(Number(viewBox[1])), height: Math.round(Number(viewBox[2])) };
}

function readSvgNumber(text, attr) {
  const match = text.match(new RegExp(`${attr}=["']([\\d.]+)`, "i"));
  return match ? Math.round(Number(match[1])) : null;
}

function readUInt24LE(buffer, offset) {
  return buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
