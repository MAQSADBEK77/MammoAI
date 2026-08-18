"use client";

import { useEffect, useState } from "react";
import { MapPin, Phone, Stethoscope } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui";
import { apiGetClinics, type Clinic } from "@/lib/store";
import { useT } from "@/lib/i18n/context";

export default function ClinicsPage() {
  const t = useT();
  const [clinics, setClinics] = useState<Clinic[]>([]);

  useEffect(() => {
    apiGetClinics().then(setClinics);
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
            <Stethoscope size={22} />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-pink-900 dark:text-white sm:text-3xl">{t.clinicsPage.title}</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{t.clinicsPage.subtitle}</p>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          {clinics.map((c) => (
            <Card key={c.id} className="p-5">
              <h2 className="font-semibold text-pink-900 dark:text-white">{c.name}</h2>
              <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
                {c.address && (
                  <span className="flex items-center gap-2">
                    <MapPin size={14} className="shrink-0 text-slate-400" />
                    {c.address}
                  </span>
                )}
                {c.phone && (
                  <span className="flex items-center gap-2">
                    <Phone size={14} className="shrink-0 text-slate-400" />
                    {c.phone}
                  </span>
                )}
              </div>
              {c.note && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{c.note}</p>}
            </Card>
          ))}
          {clinics.length === 0 && (
            <Card className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">{t.clinicsPage.empty}</Card>
          )}
        </div>
      </main>
    </div>
  );
}
