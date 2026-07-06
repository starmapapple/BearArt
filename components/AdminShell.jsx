"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminDeployButton from "@/components/AdminDeployButton";

const navSections = [
  {
    label: "运营",
    items: [
      { href: "/admin", label: "数据概览", exact: true, icon: "overview" },
      { href: "/admin/analytics", label: "转化分析", icon: "analytics" },
      { href: "/admin/products", label: "落地页管理", icon: "pages" },
      { href: "/admin/assets", label: "素材管理", icon: "assets" },
      { href: "/admin/orders", label: "订单管理", icon: "orders" }
    ]
  },
  {
    label: "系统",
    items: [
      { href: "/admin/logs", label: "操作日志", icon: "logs" },
      { href: "/admin/readiness", label: "上线检查", icon: "readiness" }
    ]
  }
];

const navItems = navSections.flatMap((section) => section.items);

export default function AdminShell({ children }) {
  const pathname = usePathname();

  const isActive = (item) => {
    if (item.exact) {
      return pathname === item.href;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const activeItem = navItems.find((item) => isActive(item)) || navItems[0];

  return (
    <div className="admin-layout">
      <a className="skip-link" href="#admin-content">
        跳到主要内容
      </a>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">
            BA
          </span>
          <div>
            <h1>Bear Art Admin</h1>
            <p>印尼投放运营后台</p>
          </div>
        </div>
        <nav className="nav-list" aria-label="后台导航">
          {navSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <p className="sidebar-section-label">{section.label}</p>
              {section.items.map((item) => {
                const active = isActive(item);

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`nav-tab${active ? " is-active" : ""}`}
                    href={item.href}
                    key={item.href}
                  >
                    <NavIcon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <form action="/api/admin/logout" method="post" className="admin-logout-form">
          <button className="nav-tab logout-tab" type="submit">
            <NavIcon name="logout" />
            <span>退出登录</span>
          </button>
        </form>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <span>Bear Art Admin</span>
            <strong>{activeItem.label}</strong>
          </div>
          <div className="admin-topbar-actions">
            <AdminDeployButton />
            <Link className="admin-preview-link" href="/p/colorbear-art" target="_blank">
              <NavIcon name="external" />
              <span>打开前台</span>
            </Link>
          </div>
        </header>
        <main className="admin-main" id="admin-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

function NavIcon({ name }) {
  const paths = {
    overview: "M4 13h6v7H4v-7Zm10-9h6v16h-6V4ZM4 4h6v5H4V4Z",
    analytics: "M4 19V5m0 14h16M8 15l3-4 3 2 4-7",
    pages: "M6 3h9l3 3v15H6V3Zm8 0v4h4",
    assets: "M5 5h14v14H5V5Zm3 10 3-4 2 2 2-3 3 5",
    orders: "M6 4h12v16H6V4Zm3 4h6M9 12h6M9 16h4",
    logs: "M5 6h14M5 12h14M5 18h10",
    readiness: "M4 12l5 5L20 6",
    logout: "M10 5H5v14h5M13 8l4 4-4 4M8 12h9",
    external: "M8 6h10v10M18 6 8 16M6 8v10h10"
  };

  return (
    <svg className="nav-icon" aria-hidden="true" viewBox="0 0 24 24">
      <path d={paths[name]} />
    </svg>
  );
}
