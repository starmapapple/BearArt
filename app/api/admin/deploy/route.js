import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/auditLog";

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.VERCEL_DEPLOY_HOOK_URL)
  });
}

export async function POST() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://grupbeli.com";

  if (!hookUrl) {
    return NextResponse.json(
      {
        error: "还没有配置 VERCEL_DEPLOY_HOOK_URL。请先在 Vercel 创建 Deploy Hook，并添加到 Production 环境变量。"
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(hookUrl, {
      method: "POST",
      cache: "no-store"
    });
    const text = await response.text();
    let payload = {};

    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { message: text };
    }

    if (!response.ok) {
      await writeAuditLog({
        action: "deploy_failed",
        entityType: "deployment",
        entityId: "vercel",
        summary: "触发线上发布失败",
        details: { status: response.status, payload }
      });

      return NextResponse.json(
        { error: payload?.error?.message || payload?.message || "触发发布失败，请检查 Deploy Hook。" },
        { status: 502 }
      );
    }

    await writeAuditLog({
      action: "deploy_requested",
      entityType: "deployment",
      entityId: payload?.job?.id || payload?.id || "vercel",
      summary: "已触发线上发布",
      details: payload
    });

    return NextResponse.json({
      ok: true,
      message: "已触发线上发布，Vercel 正在构建。",
      checkUrl: `${siteUrl.replace(/\/$/, "")}/p/colorbear-art`,
      deployment: payload
    });
  } catch (error) {
    await writeAuditLog({
      action: "deploy_failed",
      entityType: "deployment",
      entityId: "vercel",
      summary: "触发线上发布失败",
      details: { message: error.message }
    });

    return NextResponse.json({ error: error.message || "触发发布失败。" }, { status: 502 });
  }
}
