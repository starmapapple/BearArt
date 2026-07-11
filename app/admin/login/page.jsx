import AdminLanguageSwitcher from "@/components/AdminLanguageSwitcher";
import { getAdminLocale } from "@/lib/adminLocaleServer";
import { translateAdmin } from "@/lib/adminI18n";

export default async function AdminLoginPage({ searchParams }) {
  const query = await searchParams;
  const locale = await getAdminLocale();
  const t = (text) => translateAdmin(locale, text);
  const next = query?.next || "/admin";

  return (
    <main className="admin-login-page">
      <section className="card admin-login-card">
        <div className="admin-login-language"><AdminLanguageSwitcher locale={locale} /></div>
        <div className="admin-login-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">
            BA
          </span>
          <div>
            <h1>Bear Art Admin</h1>
            <p className="muted">{t("印尼投放运营后台")}</p>
          </div>
        </div>
        <h2>{t("后台登录")}</h2>
        <p className="muted">{t("请输入管理员密码。正式上线前请在环境变量里设置 ADMIN_PASSWORD。")}</p>
        <form action="/api/admin/login" method="post" className="grid">
          <input name="next" type="hidden" value={next} />
          <div className="field">
            <label htmlFor="password">{t("管理员密码")}</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="btn" type="submit">
            {t("登录")}
          </button>
          {query?.error ? <p className="field-error">{locale === "id" ? "Kata sandi salah." : "密码不正确。"}</p> : null}
          {process.env.NODE_ENV !== "production" && !process.env.ADMIN_PASSWORD ? <p className="muted">{locale === "id" ? "Kata sandi lokal default: admin123" : "本地开发默认密码：admin123"}</p> : null}
        </form>
      </section>
    </main>
  );
}
