import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getAssetReferences, resolvePublicAssetPath } from "@/lib/adminAssets";
import { writeAuditLog } from "@/lib/auditLog";
import { getProducts } from "@/lib/store";

export async function POST(request) {
  try {
    const { path } = await request.json();
    const { normalized, absolutePath } = resolvePublicAssetPath(path);
    const references = getAssetReferences(await getProducts()).get(normalized) || [];

    if (references.length) {
      return NextResponse.json(
        {
          error: "素材正在被引用，不能删除。请先替换对应落地页素材。",
          references
        },
        { status: 409 }
      );
    }

    await fs.unlink(absolutePath);
    await writeAuditLog({
      action: "asset_deleted",
      entityType: "asset",
      entityId: normalized,
      summary: "删除未应用素材",
      details: { url: normalized }
    });

    return NextResponse.json({ ok: true, url: normalized });
  } catch (error) {
    const message = error?.code === "EROFS"
      ? "当前线上环境不支持直接删除素材文件。请在本地删除后重新部署，或后续接 Bunny/R2 素材库。"
      : error.message || "删除失败。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
