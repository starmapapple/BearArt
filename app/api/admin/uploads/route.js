import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/auditLog";

const uploadDir = path.join(process.cwd(), "public", "uploads");
const allowedTypes = ["image/", "video/"];
const maxFileSize = 80 * 1024 * 1024;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = safeSegment(formData.get("folder") || "products");
    const compression = safeCompression(formData.get("compression") || "");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "请选择要上传的文件。" }, { status: 400 });
    }

    if (!allowedTypes.some((type) => file.type?.startsWith(type))) {
      return NextResponse.json({ error: "只支持图片或视频文件。" }, { status: 400 });
    }

    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "文件不能超过 80MB。" }, { status: 400 });
    }

    const extension = path.extname(file.name || "").toLowerCase() || guessExtension(file.type);
    const baseName = safeSegment(path.basename(file.name || "asset", extension));
    const targetDir = path.join(uploadDir, folder);
    const compressionPart = compression && !baseName.endsWith(`-${compression}`) ? `-${compression}` : "";
    const fileName = await getUniqueFileName(targetDir, `${baseName}${compressionPart}${extension}`);
    const targetPath = path.join(targetDir, fileName);

    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetPath, Buffer.from(await file.arrayBuffer()));

    const url = `/uploads/${folder}/${fileName}`;

    await writeAuditLog({
      action: compression ? "asset_compressed" : "asset_uploaded",
      entityType: "asset",
      entityId: url,
      summary: compression ? `生成${compressionLabel(compression)}压缩素材` : "上传新素材",
      details: {
        url,
        folder,
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        compression
      }
    });

    return NextResponse.json({
      url,
      type: file.type,
      size: file.size
    });
  } catch (error) {
    const message = error?.code === "EROFS"
      ? "当前线上环境不支持直接写入素材文件。请在本地上传后重新部署，或后续接 Bunny/R2 素材库。"
      : error.message || "上传失败。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function safeSegment(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "products";
}

function safeCompression(value) {
  return ["high", "balanced", "small"].includes(value) ? value : "";
}

function compressionLabel(value) {
  return {
    high: "高清",
    balanced: "均衡",
    small: "极小"
  }[value] || "";
}

async function getUniqueFileName(targetDir, fileName) {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);
  let candidate = fileName;
  let index = 2;

  while (true) {
    try {
      await fs.access(path.join(targetDir, candidate));
      candidate = `${baseName}-${index}${extension}`;
      index += 1;
    } catch {
      return candidate;
    }
  }
}

function guessExtension(type) {
  if (type === "video/mp4") return ".mp4";
  if (type === "video/webm") return ".webm";
  if (type === "image/png") return ".png";
  if (type === "image/jpeg") return ".jpg";
  return "";
}
