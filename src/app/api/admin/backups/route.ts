import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { requireAdminOrModerator } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

const BACKUP_DIR = path.join(process.cwd(), "data", "backups");

export async function GET() {
  try {
    await requireAdminOrModerator();
    if (!fs.existsSync(BACKUP_DIR)) return NextResponse.json({ backups: [] });

    const backups = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".db"))
      .map((filename) => {
        const stat = fs.statSync(path.join(BACKUP_DIR, filename));
        return { filename, sizeBytes: stat.size, createdAt: stat.mtime.toISOString() };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ backups });
  } catch (err) {
    return handleApiError(err);
  }
}
