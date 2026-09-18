"use client";

// ADMIN-001: bitta umumiy parol o'rniga har bir admin uchun alohida hisob +
// har bir muhim amal (obuna berish, mazmun o'chirish, foydalanuvchini
// bloklash...) qaysi admin tomonidan qilinganini ko'rsatadigan audit-jurnal.

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminAccountSummary, type AdminAuditEntry } from "@/lib/admin-api";
import { Card, Button, ErrorState } from "@/components/ui";

const ACTION_LABELS: Record<string, string> = {
  login: "Kirdi",
  premium_granted: "Premium berdi",
  premium_revoked: "Premium bekor qildi",
  post_deleted: "Postni o'chirdi",
  comment_deleted: "Izohni o'chirdi",
  report_resolved: "Shikoyatni ko'rib chiqdi",
  report_dismissed: "Shikoyatni bekor qildi",
  user_blocked: "Foydalanuvchini bloklandi",
  user_unblocked: "Foydalanuvchini blokdan chiqardi",
  user_deleted: "Foydalanuvchini o'chirdi",
  admin_created: "Yangi admin qo'shdi",
  admin_deleted: "Adminni o'chirdi",
  pregnancy_content_updated: "Homiladorlik kontentini yangiladi",
};

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<AdminAccountSummary[] | null>(null);
  const [entries, setEntries] = useState<AdminAuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // OVERNIGHT-08: `loadAdmins`/audit-jurnal so'rovlarida `.catch()` UMUMAN
  // yo'q edi — muvaffaqiyatsizlikda `admins`/`entries` abadiy `null` qolib,
  // "Yuklanmoqda…" holati qayta urinish imkoniyatisiz qotib qolardi.
  const [adminsLoadError, setAdminsLoadError] = useState<string | null>(null);
  const [entriesLoadError, setEntriesLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAdmins = useCallback(() => {
    setAdminsLoadError(null);
    adminApi.admins
      .list()
      .then((res) => setAdmins(res.admins))
      .catch((err) => setAdminsLoadError(err instanceof Error ? err.message : "Yuklashda xatolik"));
  }, []);

  const loadAuditLog = useCallback(() => {
    setEntriesLoadError(null);
    adminApi.auditLog
      .list()
      .then((res) => setEntries(res.entries))
      .catch((err) => setEntriesLoadError(err instanceof Error ? err.message : "Yuklashda xatolik"));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadAdmins();
      loadAuditLog();
    }, 0);
    return () => clearTimeout(timeout);
  }, [loadAdmins, loadAuditLog]);

  async function createAdmin() {
    setError(null);
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError("Ism, email va kamida 8 belgili parol kerak");
      return;
    }
    setCreating(true);
    try {
      await adminApi.admins.create({ name: name.trim(), email: email.trim(), password });
      setName("");
      setEmail("");
      setPassword("");
      setFormOpen(false);
      loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setCreating(false);
    }
  }

  async function removeAdmin(id: string) {
    if (!window.confirm("Bu admin hisobini o'chirishni tasdiqlaysizmi?")) return;
    setDeletingId(id);
    setError(null);
    // FIX2-02: catch yo'q edi (createAdmin'dan farqli) — o'chirish
    // muvaffaqiyatsiz bo'lsa hech narsa ko'rsatilmasdi.
    try {
      await adminApi.admins.delete(id);
      loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Adminlar</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Har bir admin o&apos;z email+paroli bilan kiradi — kim nima qilgani pastdagi audit-jurnalda ko&apos;rinadi. Eski umumiy
          parol (ADMIN_PASSWORD) hali ham favqulodda kirish sifatida ishlaydi.
        </p>
      </div>

      {error && <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{error}</Card>}

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-text-primary">Admin hisoblari</p>
          <Button className="px-4! py-2! text-xs" onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? "Bekor qilish" : "+ Yangi admin"}
          </Button>
        </div>

        {formOpen && (
          <div className="flex flex-col gap-2 rounded-2xl bg-surface-muted/60 p-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ism"
              className="tap-target rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="tap-target rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parol (kamida 8 belgi)"
              type="password"
              className="tap-target rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary"
            />
            <Button className="text-xs" disabled={creating} onClick={createAdmin}>
              {creating ? "Qo'shilmoqda…" : "Qo'shish"}
            </Button>
          </div>
        )}

        {adminsLoadError ? (
          <ErrorState message={adminsLoadError} retry={{ label: "Qayta urinish", onClick: loadAdmins }} bare />
        ) : !admins ? (
          <p className="text-sm text-text-muted">Yuklanmoqda…</p>
        ) : admins.length === 0 ? (
          <p className="text-sm text-text-muted">Hali alohida admin hisobi yo&apos;q — hozircha umumiy parol ishlatilmoqda</p>
        ) : (
          <div className="flex flex-col gap-2">
            {admins.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-muted px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{a.name}</p>
                  <p className="text-xs text-text-muted">{a.email}</p>
                </div>
                <button
                  type="button"
                  disabled={deletingId === a.id}
                  onClick={() => removeAdmin(a.id)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
                >
                  O&apos;chirish
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="font-semibold text-text-primary">Audit-jurnal (so&apos;nggi 100 ta amal)</p>
        {entriesLoadError ? (
          <ErrorState message={entriesLoadError} retry={{ label: "Qayta urinish", onClick: loadAuditLog }} bare />
        ) : !entries ? (
          <p className="text-sm text-text-muted">Yuklanmoqda…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-text-muted">Hali hech qanday yozuv yo&apos;q</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-none">
                <div className="min-w-0">
                  <span className="font-semibold text-text-primary">{e.adminLabel}</span>{" "}
                  <span className="text-text-secondary">{ACTION_LABELS[e.action] ?? e.action}</span>
                  {e.detail && <span className="ml-1 text-xs text-text-muted">({e.detail})</span>}
                </div>
                <span className="shrink-0 text-xs text-text-muted">{formatDateTime(e.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
