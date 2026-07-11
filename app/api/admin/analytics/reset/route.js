import { NextResponse } from "next/server";
import { resetAnalyticsBaseline } from "@/lib/analytics";
import { writeAuditLog } from "@/lib/auditLog";

export async function POST() {
  try {
    const marker = await resetAnalyticsBaseline();
    await writeAuditLog({
      action: "analytics_baseline_reset",
      entityType: "analytics",
      entityId: marker.id,
      summary: "重置分析统计起点",
      details: { baselineAt: marker.createdAt }
    });
    return NextResponse.json({ ok: true, baselineAt: marker.createdAt });
  } catch (error) {
    return NextResponse.json({ error: error.message || "重置分析数据失败。" }, { status: 400 });
  }
}
