const ASSET_BASE_URL = (process.env.NEXT_PUBLIC_ASSET_BASE_URL || "").replace(/\/+$/, "");

export function assetUrl(path) {
  if (!path || typeof path !== "string") return path;
  if (!ASSET_BASE_URL) return path;
  if (!path.startsWith("/")) return path;
  if (path.startsWith("//")) return path;
  return `${ASSET_BASE_URL}${path}`;
}

export function assetList(paths = []) {
  return paths.filter(Boolean).map((path) => assetUrl(path));
}

export function getAssetBaseUrl() {
  return ASSET_BASE_URL;
}
