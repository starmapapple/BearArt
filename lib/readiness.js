export function getReadinessChecks() {
  const paymentProvider = process.env.PAYMENT_PROVIDER || "cod_only";
  const logisticsProvider = process.env.LOGISTICS_PROVIDER || "disabled";
  const codOnly = paymentProvider === "cod_only";
  const checks = [
    check("正式站点 URL", Boolean(process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL), "NEXT_PUBLIC_SITE_URL"),
    check("管理员密码", Boolean(process.env.ADMIN_PASSWORD), "ADMIN_PASSWORD"),
    check("管理员会话密钥", Boolean(process.env.ADMIN_SESSION_SECRET), "ADMIN_SESSION_SECRET"),
    check("客服 WhatsApp", Boolean(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP), "NEXT_PUBLIC_SUPPORT_WHATSAPP"),
    check("图片 CDN 域名", Boolean(process.env.NEXT_PUBLIC_ASSET_BASE_URL), "NEXT_PUBLIC_ASSET_BASE_URL", true),
    check("一键发布 Hook", Boolean(process.env.VERCEL_DEPLOY_HOOK_URL), "VERCEL_DEPLOY_HOOK_URL", true),
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

  if (logisticsProvider !== "disabled") {
    checks.push(
      check("物流供应商", logisticsProvider === "biteship", "LOGISTICS_PROVIDER"),
      check("Biteship API Key", Boolean(process.env.BITESHIP_API_KEY), "BITESHIP_API_KEY"),
      check("物流 Webhook Token", Boolean(process.env.BITESHIP_WEBHOOK_TOKEN), "BITESHIP_WEBHOOK_TOKEN"),
      check("仓库联系人", Boolean(process.env.LOGISTICS_ORIGIN_CONTACT_NAME), "LOGISTICS_ORIGIN_CONTACT_NAME"),
      check("仓库联系电话", Boolean(process.env.LOGISTICS_ORIGIN_CONTACT_PHONE), "LOGISTICS_ORIGIN_CONTACT_PHONE"),
      check("仓库取件地址", Boolean(process.env.LOGISTICS_ORIGIN_ADDRESS), "LOGISTICS_ORIGIN_ADDRESS"),
      check("仓库邮政编码", Boolean(process.env.LOGISTICS_ORIGIN_POSTAL_CODE), "LOGISTICS_ORIGIN_POSTAL_CODE")
    );
  } else {
    checks.push(check("物流供应商", false, "LOGISTICS_PROVIDER", true));
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
