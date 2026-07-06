import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { resolvePublicAssetPath } from "@/lib/adminAssets";
import { writeAuditLog } from "@/lib/auditLog";

const allowedTypes = ["image/", "video/"];
const maxFileSize = 80 * 1024 * 1024;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const assetPath = formData.get("path");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "请选择替换文件。" }, { status: 400 });
    }

    if (!allowedTypes.some((type) => file.type?.startsWith(type))) {
      return NextResponse.json({ error: "只支持图片或视频文件。" }, { status: 400 });
    }

    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "文件不能超过 80MB。" }, { status: 400 });
    }

    const { normalized, absolutePath } = resolvePublicAssetPath(assetPath);
    const currentExtension = path.extname(absolutePath).toLowerCase();
    const nextExtension = path.extname(file.name || "").toLowerCase();

    if (!currentExtension || !nextExtension || currentExtension !== nextExtension) {
      return NextResponse.json({ error: `请上传同格式文件，当前素材需要 ${currentExtension || "相同"} 格式。` }, { status: 400 });
    }

    await fs.access(absolutePath);
    await fs.writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));
    await writeAuditLog({
      action: "asset_replaced",
      entityType: "asset",
      entityId: normalized,
      summary: "重新上传并替换素材",
      details: {
        url: normalized,
        uploadedName: file.name,
        size: file.size,
        type: file.type
      }
    });

    return NextResponse.json({
      ok: true,
      url: normalized,
      type: file.type,
      size: file.size
    });
  } catch (error) {
    const message = error?.code === "EROFS"
      ? "当前线上环境不支持直接写入素材文件。请在本地替换后重新部署，或后续接 Bunny/R2 素材库。"
      : error.message || "替换失败。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
