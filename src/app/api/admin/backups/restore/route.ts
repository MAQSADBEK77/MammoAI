import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { logAdminAction } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

const DATA_DIR = path.join(process.cwd(), "data");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const DB_PATH = path.join(DATA_DIR, "mammoai.db");

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

// Restoring overwrites every user's data with a past snapshot — about as
// destructive and hard-to-reverse as this app gets. Full admin only, and the
// caller must echo back the exact filename as an explicit confirmation (the
// UI makes them type it), not just click through a dialog.
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const { filename, confirmFilename } = (await request.json()) ?? {};

    if (typeof filename !== "string" || path.basename(filename) !== filename || !filename.endsWith(".db")) {
      throw new ApiError(400, "Fayl nomi noto'g'ri.");
    }
    if (confirmFilename !== filename) {
      throw new ApiError(400, "Tasdiqlash uchun fayl nomini aniq kiriting.");
    }
    const sourcePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(sourcePath)) {
      throw new ApiError(404, "Zaxira nusxa topilmadi.");
    }

    // 1. Safety snapshot of the CURRENT (about-to-be-replaced) state, so an
    // accidental or wrong restore is itself still recoverable.
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    if (fs.existsSync(DB_PATH)) {
      const preRestorePath = path.join(BACKUP_DIR, `mammoai-PRE-RESTORE-${timestamp()}.db`);
      const liveDb = new Database(DB_PATH, { readonly: true });
      try {
        await liveDb.backup(preRestorePath);
      } finally {
        liveDb.close();
      }
    }

    // 2. Atomically swap the chosen backup into place. Renaming (not
    // copying in-place) means the currently-running process's already-open
    // file descriptor is unaffected until it exits — no risk of it reading
    // a half-written file mid-swap.
    const tmpPath = path.join(DATA_DIR, `.restore-${Date.now()}.tmp`);
    fs.copyFileSync(sourcePath, tmpPath);
    fs.renameSync(tmpPath, DB_PATH);

    // 3. Drop the old WAL/SHM sidecars — they belong to the pre-restore
    // database and must not be replayed against the restored one.
    for (const suffix of ["-wal", "-shm"]) {
      const p = DB_PATH + suffix;
      if (fs.existsSync(p)) fs.rmSync(p);
    }

    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "backup.restore", filename);

    // The running process's in-memory DB handle still points at the old
    // (now-detached) file — only a fresh process picks up the restored one.
    // pm2 auto-restarts on exit, so this is the safe way to apply it.
    setTimeout(() => process.exit(0), 500);

    return NextResponse.json({ ok: true, restarting: true });
  } catch (err) {
    return handleApiError(err);
  }
}
