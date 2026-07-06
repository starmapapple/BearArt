import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getAuditLogRows, insertAuditLogRow, isPostgresEnabled } from "@/lib/postgres";

const dataDir = path.join(process.cwd(), "data");
const logsPath = path.join(dataDir, "action-logs.json");

export async function writeAuditLog(input) {
  const now = new Date().toISOString();
  const log = {
    id: `log_${randomUUID()}`,
    action: String(input.action || "changed"),
    entityType: String(input.entityType || "system"),
    entityId: String(input.entityId || ""),
    summary: String(input.summary || "已记录操作"),
    details: input.details || {},
    createdAt: now
  };

  if (isPostgresEnabled()) {
    await insertAuditLogRow(log);
    return log;
  }

  const logs = await readLogs();
  logs.unshift(log);
  await writeLogs(logs.slice(0, 1000));
  return log;
}

export async function getAuditLogs(limit = 200) {
  if (isPostgresEnabled()) {
    return getAuditLogRows(limit);
  }

  return (await readLogs()).slice(0, Math.min(Math.max(Number(limit) || 200, 1), 1000));
}

async function readLogs() {
  try {
    const raw = await fs.readFile(logsPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeLogs(logs) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(logsPath, JSON.stringify(logs, null, 2));
}
