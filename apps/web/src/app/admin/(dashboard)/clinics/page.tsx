"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Clinic, ClinicSpecialty } from "@mammoai/shared";
import { adminApi } from "@/lib/admin-api";
import { Card, Button, Badge } from "@/components/ui";

const SPECIALTIES: { value: ClinicSpecialty; label: string }[] = [
  { value: "gynecology", label: "Ginekologiya" },
  { value: "oncology", label: "Onkologiya" },
  { value: "radiology", label: "Radiologiya" },
  { value: "general", label: "Umumiy amaliyot" },
  { value: "endocrinology", label: "Endokrinologiya" },
  { value: "reproductology", label: "Reproduktologiya" },
  { value: "laparoscopy", label: "Laparoskopiya" },
];

const SPECIALTY_LABELS = Object.fromEntries(SPECIALTIES.map((s) => [s.value, s.label])) as Record<ClinicSpecialty, string>;

type FormState = {
  name: string;
  address: string;
  region: string;
  lat: string;
  lng: string;
  phone: string;
  specialties: ClinicSpecialty[];
  freeScreening: boolean;
};

const EMPTY_FORM: FormState = { name: "", address: "", region: "", lat: "", lng: "", phone: "", specialties: [], freeScreening: false };

function inputClass() {
  return "tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
}

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    adminApi.clinics
      .list()
      .then(setClinics)
      .catch((err) => setError(err instanceof Error ? err.message : "Yuklashda xatolik"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(clinic: Clinic) {
    setEditingId(clinic.id);
    setForm({
      name: clinic.name,
      address: clinic.address,
      region: clinic.region,
      lat: String(clinic.lat),
      lng: String(clinic.lng),
      phone: clinic.phone,
      specialties: clinic.specialties,
      freeScreening: clinic.freeScreening,
    });
    setFormOpen(true);
  }

  function toggleSpecialty(value: ClinicSpecialty) {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(value) ? f.specialties.filter((s) => s !== value) : [...f.specialties, value],
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      region: form.region.trim(),
      lat: Number(form.lat) || 0,
      lng: Number(form.lng) || 0,
      phone: form.phone.trim(),
      specialties: form.specialties,
      freeScreening: form.freeScreening,
    };
    try {
      if (editingId) {
        await adminApi.clinics.update(editingId, payload);
      } else {
        await adminApi.clinics.create(payload);
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(clinic: Clinic) {
    if (!window.confirm(`"${clinic.name}" klinikasini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await adminApi.clinics.delete(clinic.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "O'chirishda xatolik");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Klinikalar</h1>
          <p className="mt-1 text-sm text-text-secondary">Jami {clinics.length} ta klinika bazada</p>
        </div>
        <Button onClick={openCreate}>+ Yangi klinika</Button>
      </div>

      {error && <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{error}</Card>}

      {formOpen && (
        <Card className="border border-primary/20">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <h2 className="col-span-full text-base font-bold text-text-primary">{editingId ? "Klinikani tahrirlash" : "Yangi klinika"}</h2>
            <input required placeholder="Nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass()} />
            <input required placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass()} />
            <input
              required
              placeholder="Manzil"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={`${inputClass()} sm:col-span-2`}
            />
            <input required placeholder="Hudud (masalan: Toshkent)" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className={inputClass()} />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Kenglik (lat)" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className={inputClass()} />
              <input placeholder="Uzunlik (lng)" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className={inputClass()} />
            </div>

            <div className="col-span-full">
              <p className="mb-2 text-xs font-semibold text-text-secondary">Mutaxassisliklar</p>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => {
                  const active = form.specialties.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleSpecialty(s.value)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                        active ? "bg-primary text-white" : "bg-surface-muted text-text-secondary hover:bg-primary-light/40"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="col-span-full flex items-center gap-2 text-sm font-medium text-text-secondary">
              <input type="checkbox" checked={form.freeScreening} onChange={(e) => setForm({ ...form, freeScreening: e.target.checked })} className="h-4 w-4 rounded accent-primary" />
              Bepul skrining mavjud
            </label>

            <div className="col-span-full flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saqlanmoqda…" : editingId ? "Saqlash" : "Qo'shish"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-text-muted">
                <th className="px-5 py-3">Nomi</th>
                <th className="px-5 py-3">Hudud</th>
                <th className="px-5 py-3">Mutaxassislik</th>
                <th className="px-5 py-3">Bepul skrining</th>
                <th className="px-5 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-muted">
                    Yuklanmoqda…
                  </td>
                </tr>
              )}
              {!loading && clinics.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-muted">
                    Hozircha klinika yo&apos;q
                  </td>
                </tr>
              )}
              {!loading &&
                clinics.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-surface-muted/60">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-text-primary">{c.name}</div>
                      <div className="text-xs text-text-muted">{c.address}</div>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{c.region}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.specialties.slice(0, 2).map((s) => (
                          <Badge key={s} tone="muted">
                            {SPECIALTY_LABELS[s] ?? s}
                          </Badge>
                        ))}
                        {c.specialties.length > 2 && <Badge tone="muted">+{c.specialties.length - 2}</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3">{c.freeScreening ? <Badge tone="success">Ha</Badge> : <Badge tone="muted">Yo&apos;q</Badge>}</td>
                    <td className="px-5 py-3 text-right">
                      <button type="button" onClick={() => openEdit(c)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10">
                        Tahrirlash
                      </button>
                      <button type="button" onClick={() => handleDelete(c)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10">
                        O&apos;chirish
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
