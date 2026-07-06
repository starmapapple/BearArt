export function getReadinessChecks() {
  const paymentProvider = process.env.PAYMENT_PROVIDER || "cod_only";
  const codOnly = paymentProvider === "cod_only";
  const checks = [
    check("正式站点 URL", Boolean(process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL), "NEXT_PUBLIC_SITE_URL"),
    check("管理员密码", Boolean(process.env.ADMIN_PASSWORD), "ADMIN_PASSWORD"),
    check("管理员会话密钥", Boolean(process.env.ADMIN_SESSION_SECRET), "ADMIN_SESSION_SECRET"),
    check("客服 WhatsApp", Boolean(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP), "NEXT_PUBLIC_SUPPORT_WHATSAPP"),
    check("图片 CDN 域名", Boolean(process.env.NEXT_PUBLIC_ASSET_BASE_URL), "NEXT_PUBLIC_ASSET_BASE_URL", true),
    check("PostgreSQL 连接串", Boolean(process.env.DATABASE_URL), "DATABASE_URL"),
    check("支付模式", codOnly || paymentProvider === "xendit" || paymentProvider === "midtrans", "PAYMENT_PROVIDER"),
    check("Webhook Secret", codOnly || Boolean(process.env.PAYMENT_WEBHOOK_SECRET || process.env.XENDIT_CALLBACK_TOKEN), "PAYMENT_WEBHOOK_SECRET", codOnly)
  ];

  if (paymentProvider === "xendit") {
    checks.push(check("Xendit Secret Key", Boolean(process.env.XENDIT_SECRET_KEY), "XENDIT_SECRET_KEY"));
  }

  if (paymentProvider === "midtrans") {
    checks.push(check("Midtrans Server Key", Boolean(process.env.MIDTRANS_SERVER_KEY), "MIDTRANS_SERVER_KEY"));
  }

  return checks;
}

function check(label, ready, envKey, optional = false) {
  return {
    label,
    ready,
    envKey,
    optional,
    status: ready ? "ready" : "missing"
  };
}
