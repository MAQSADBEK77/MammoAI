// Standalone process (run under pm2, see README) that keeps rolling backups
// of data/mammoai.db. Since this app's whole point is "your own computer is
// the server" (no managed database, no cloud snapshots), losing the data/
// folder — a bad `rm -rf`, a failing disk, a typo — would mean losing
// everything. This is the safety net.
//
// Uses better-sqlite3's built-in .backup() (SQLite's own online backup API)
// rather than copying the file directly — a plain `cp` of a WAL-mode
// database can grab a half-written state; .backup() always produces a
// consistent snapshot, even while the app is live and writing.

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "mammoai.db");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // daily
const KEEP_BACKUPS = 14; // ~2 weeks of daily snapshots

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function runBackup() {
  if (!fs.existsSync(DB_PATH)) {
    console.log(`[${new Date().toISOString()}] no database yet at ${DB_PATH}, skipping.`);
    return;
  }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const dest = path.join(BACKUP_DIR, `mammoai-${timestamp()}.db`);
  const db = new Database(DB_PATH, { readonly: true });
  try {
    await db.backup(dest);
    const { size } = fs.statSync(dest);
    console.log(`[${new Date().toISOString()}] backup written: ${dest} (${(size / 1024).toFixed(0)} KB)`);
  } finally {
    db.close();
  }

  pruneOldBackups();
}

function pruneOldBackups() {
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("mammoai-") && f.endsWith(".db"))
    .map((f) => ({ name: f, path: path.join(BACKUP_DIR, f), mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  for (const stale of files.slice(KEEP_BACKUPS)) {
    fs.unlinkSync(stale.path);
    console.log(`[${new Date().toISOString()}] pruned old backup: ${stale.name}`);
  }
}

async function main() {
  console.log(`MammoAI backup process starting — writing to ${BACKUP_DIR}, every ${BACKUP_INTERVAL_MS / 3600000}h, keeping last ${KEEP_BACKUPS}.`);

  // One immediately on start (covers "just deployed, want a baseline"),
  // then on the regular cadence.
  await runBackup().catch((err) => console.error("backup error:", err.message));

  setInterval(() => {
    runBackup().catch((err) => console.error("backup error:", err.message));
  }, BACKUP_INTERVAL_MS);
}

main();
