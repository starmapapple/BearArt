export const INDONESIA_PHONE_HINT = "请输入有效的印尼 WhatsApp 手机号，例如 081234567890 或 +6281234567890。";

export function normalizeIndonesiaPhone(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("62")) {
    return `0${digits.slice(2)}`;
  }

  return digits;
}

export function validateIndonesiaWhatsapp(value) {
  const normalized = normalizeIndonesiaPhone(value);
  const valid = /^08\d{8,11}$/.test(normalized);

  return {
    normalized,
    e164: valid ? `+62${normalized.slice(1)}` : "",
    valid
  };
}
