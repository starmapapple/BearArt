import { cookies } from "next/headers";
import { normalizeAdminLocale } from "@/lib/adminI18n";

export async function getAdminLocale() {
  const store = await cookies();
  return normalizeAdminLocale(store.get("admin_locale")?.value);
}
