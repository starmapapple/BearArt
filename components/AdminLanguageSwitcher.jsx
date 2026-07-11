"use client";

import { useRouter } from "next/navigation";
import { translateAdmin } from "@/lib/adminI18n";

export default function AdminLanguageSwitcher({ locale = "zh" }) {
  const router = useRouter();

  function changeLocale(nextLocale) {
    if (nextLocale === locale) return;
    document.cookie = `admin_locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="admin-language-switch" role="group" aria-label={translateAdmin(locale, "切换后台语言")}>
      <button className={locale === "zh" ? "is-active" : ""} type="button" onClick={() => changeLocale("zh")}>中文</button>
      <button className={locale === "id" ? "is-active" : ""} type="button" onClick={() => changeLocale("id")}>ID</button>
    </div>
  );
}
