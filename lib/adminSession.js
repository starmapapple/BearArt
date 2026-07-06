export const ADMIN_COOKIE_NAME = "beart_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "admin123");
}

export async function createAdminToken() {
  const issuedAt = Date.now();
  const signature = await signAdminValue(String(issuedAt));
  return `${issuedAt}.${signature}`;
}

export async function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return false;
  const [issuedAt, signature] = token.split(".");
  const issuedAtNumber = Number(issuedAt);
  if (!issuedAt || !signature || !Number.isFinite(issuedAtNumber)) return false;
  if (Date.now() - issuedAtNumber > ADMIN_SESSION_MAX_AGE * 1000) return false;
  const expected = await signAdminValue(issuedAt);
  return signature === expected;
}

async function signAdminValue(value) {
  const secret = process.env.ADMIN_SESSION_SECRET || getAdminPassword();
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toHex(signature);
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
