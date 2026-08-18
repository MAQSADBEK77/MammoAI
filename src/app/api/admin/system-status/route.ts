import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { requireAdminOrModerator } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

const DATA_DIR = path.join(process.cwd(), "data");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

export async function GET() {
  try {
    await requireAdminOrModerator();

    let lastBackupAt: string | null = null;
    let backupCount = 0;
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".db"));
      backupCount = files.length;
      const mtimes = files.map((f) => fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime());
      if (mtimes.length) lastBackupAt = new Date(Math.max(...mtimes)).toISOString();
    }

    const dbPath = path.join(DATA_DIR, "mammoai.db");
    const dbSizeBytes = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;

    return NextResponse.json({
      appUptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      dbSizeBytes,
      lastBackupAt,
      backupCount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
