export const INDONESIA_NAME_HINT = "请填写有效姓名，至少 2 个字符，可包含字母、数字、空格、点、撇号或连字符。";

export function validateIndonesiaName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  const meaningfulChars = name.replace(/[^\p{L}\p{N}]/gu, "");
  const allowed = /^[\p{L}\p{N}\s.'-]+$/u.test(name);

  return {
    normalized: name,
    valid: allowed && meaningfulChars.length >= 2
  };
}
