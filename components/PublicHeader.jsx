"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function PublicHeader({ locale = "zh", mode = "default" }) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function updateHeader() {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      if (currentY < 24) {
        setHidden(false);
      } else if (delta > 8) {
        setHidden(true);
      } else if (delta < -8) {
        setHidden(false);
      }

      lastScrollY.current = currentY;
    }

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  const labels =
    locale === "id"
      ? {
          home: "Beranda",
          products: "Semua Produk",
          account: "Akun Saya",
          product: "Kembali ke Produk",
          nav: "Navigasi situs"
        }
      : {
          home: "首页",
          products: "全部商品",
          account: "个人中心",
          product: "返回商品页",
          nav: "公开站点导航"
        };
  const navItems =
    mode === "account-only"
      ? [{ href: "/account?from=colorbear", label: labels.account }]
      : mode === "product-only"
        ? [{ href: "/p/colorbear-art", label: labels.product }]
        : [
            { href: "/", label: labels.home },
            { href: "/products", label: labels.products },
            { href: "/account", label: labels.account }
          ];

  return (
    <header className={`public-header${hidden ? " is-hidden" : ""}`}>
      <Link className="brand-link" href={mode === "product-only" ? "/p/colorbear-art" : "/"}>
        Beart Art Shop
      </Link>
      <nav className="public-nav" aria-label={labels.nav}>
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
