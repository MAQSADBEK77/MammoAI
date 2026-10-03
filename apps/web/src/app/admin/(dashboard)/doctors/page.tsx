"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AdminDoctor, Clinic, ClinicSpecialty } from "@mammoai/shared";
import { summarizeDoctorRating, RATING_MIN_TO_SHOW } from "@mammoai/shared";
import { adminApi, type DoctorPayload } from "@/lib/admin-api";
import { Card, Button, Badge } from "@/components/ui";

const SPECIALTIES: { value: ClinicSpecialty; label: string }[] = [
  { value: "gynecology", label: "Ginekolog" },
  { value: "oncology", label: "Onkolog" },
  { value: "radiology", label: "Radiolog" },
  { value: "general", label: "Umumiy amaliyot shifokori" },
  { value: "endocrinology", label: "Endokrinolog" },
  { value: "reproductology", label: "Reproduktolog" },
  { value: "laparoscopy", label: "Ginekolog-jarroh" },
];
const SPECIALTY_LABELS = Object.fromEntries(SPECIALTIES.map((s) => [s.value, s.label])) as Record<ClinicSpecialty, string>;

type FormState = {
  fullName: string;
  specialty: ClinicSpecialty;
  clinicId: string;
  qualification: string;
  experienceYears: string;
  languages: string;
  photoUrl: string;
  about: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  specialty: "gynecology",
  clinicId: "",
  qualification: "",
  experienceYears: "",
  languages: "",
  photoUrl: "",
  about: "",
  isActive: true,
};

function inputClass() {
  return "tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
}

function toPayload(form: FormState): DoctorPayload {
  const years = Number(form.experienceYears);
  return {
    fullName: form.fullName.trim(),
    specialty: form.specialty,
    clinicId: form.clinicId || null,
    qualification: form.qualification.trim() || null,
    experienceYears: Number.isFinite(years) && years > 0 ? Math.round(years) : null,
    languages: form.languages.split(",").map((x) => x.trim()).filter(Boolean),
    photoUrl: form.photoUrl.trim() || null,
    about: form.about.trim() || null,
    isActive: form.isActive,
  };
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([adminApi.doctors.list(), adminApi.clinics.list()])
      .then(([d, c]) => {
        setDoctors(d);
        setClinics(c);
      })
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

  function openEdit(d: AdminDoctor) {
    setEditingId(d.id);
    setForm({
      fullName: d.fullName,
      specialty: d.specialty,
      clinicId: d.clinicId ?? "",
      qualification: d.qualification ?? "",
      experienceYears: d.experienceYears === null ? "" : String(d.experienceYears),
      languages: d.languages.join(", "),
      photoUrl: d.photoUrl ?? "",
      about: d.about ?? "",
      isActive: d.isActive,
    });
    setFormOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(form);
      if (editingId) await adminApi.doctors.update(editingId, payload);
      else await adminApi.doctors.create(payload);
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(d: AdminDoctor) {
    if (!window.confirm(`"${d.fullName}" ro'yxatdan olinsinmi? Baholari saqlanib qoladi.`)) return;
    try {
      await adminApi.doctors.deactivate(d.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Shifokorlar</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Jami {doctors.length} ta ({doctors.filter((d) => d.isActive).length} tasi ro&apos;yxatda)
          </p>
        </div>
        <Button onClick={openCreate}>+ Yangi shifokor</Button>
      </div>

      {/* Reyting qoidasi admin uchun ham ochiq yozilgan — aks holda "nega
          bu shifokorning bahosi ko'rinmayapti?" degan savol tushunarsiz
          qoladi va qo'lda "tuzatishga" urinish boshlanadi. */}
      <Card className="bg-surface-muted text-sm text-text-secondary">
        Baho faqat <b>tasdiqlangan tashrifdan</b> keyin qabul qilinadi va kamida {RATING_MIN_TO_SHOW} ta baho
        bo&apos;lgandan keyin ko&apos;rsatiladi. Shifokor o&apos;chirilmaydi — ro&apos;yxatdan olinadi, baholari esa joyida qoladi.
      </Card>

      {error && <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{error}</Card>}

      {formOpen && (
        <Card className="border border-primary/20">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <h2 className="col-span-full text-base font-bold text-text-primary">
              {editingId ? "Shifokorni tahrirlash" : "Yangi shifokor"}
            </h2>
            <input
              required
              placeholder="To'liq ismi"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={inputClass()}
            />
            <select
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value as ClinicSpecialty })}
              className={inputClass()}
            >
              {SPECIALTIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select value={form.clinicId} onChange={(e) => setForm({ ...form, clinicId: e.target.value })} className={inputClass()}>
              <option value="">Klinika tanlanmagan</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Toifa/daraja (masalan: oliy toifa)"
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              className={inputClass()}
            />
            <input
              inputMode="numeric"
              placeholder="Tajriba (yil)"
              value={form.experienceYears}
              onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
              className={inputClass()}
            />
            <input
              placeholder="Tillar, vergul bilan (O'zbek, Rus)"
              value={form.languages}
              onChange={(e) => setForm({ ...form, languages: e.target.value })}
              className={inputClass()}
            />
            <input
              placeholder="Surat havolasi (ixtiyoriy)"
              value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              className={`${inputClass()} sm:col-span-2`}
            />
            <textarea
              placeholder="Qisqacha ma'lumot"
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
              rows={3}
              className={`${inputClass()} col-span-full py-3`}
            />
            <label className="col-span-full flex items-center gap-2 text-sm font-medium text-text-secondary">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Ro&apos;yxatda ko&apos;rinsin
            </label>
            <div className="col-span-full flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
                Bekor qilish
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="text-sm text-text-secondary">Yuklanmoqda...</Card>
      ) : doctors.length === 0 ? (
        <Card className="text-sm text-text-secondary">
          Hali shifokor qo&apos;shilmagan. Ayollarga ko&apos;rsatish uchun kamida bir nechta real shifokor kerak.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {doctors.map((d) => {
            const rating = summarizeDoctorRating(d.ratings);
            return (
              <Card key={d.id} className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-text-primary">{d.fullName}</p>
                    <Badge>{SPECIALTY_LABELS[d.specialty] ?? d.specialty}</Badge>
                    {!d.isActive && <Badge tone="danger">Ro&apos;yxatda emas</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    {d.clinicName ?? "Klinika biriktirilmagan"}
                    {d.experienceYears ? ` · ${d.experienceYears} yil tajriba` : ""}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {rating.display ? `Reyting ${rating.score.toFixed(2)} · ` : ""}
                    {d.ratings.length} ta baho · {d.visitCount} ta tasdiqlangan tashrif
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => openEdit(d)}>
                    Tahrirlash
                  </Button>
                  {d.isActive && (
                    <Button variant="ghost" onClick={() => handleDeactivate(d)}>
                      Ro&apos;yxatdan olish
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
