"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ExpandMoreRounded, WarningAmberRounded } from "@mui/icons-material";
import { bmiFrom, rankHealthConcerns, type HealthConcernId } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Badge, Button, Card, ScreenHeader } from "@/components/ui";
import { Reveal } from "@/components/motion-primitives";

/**
 * CONCERN-01 — "Muammolar" ekrani.
 *
 * Nega kerak: tekshiruvlar ro'yxati "NIMA qilish kerak"ka javob beradi,
 * lekin ayol odatda tekshiruv nomi bilan emas, MUAMMO bilan keladi
 * ("hayzim kechikyapti", "homilador bo'lolmayapman"). Bu ekran shu ikkisi
 * orasidagi ko'prik — ro'yxatning o'zi loyiha shifokori bergan.
 *
 * Har bir yozuv uchta savolga javob beradi: bu nima, qachon KECHIKTIRMASLIK
 * kerak, va qaysi tekshiruv/mutaxassis. Tashxis qo'yilmaydi.
 */
export function ConcernsScreen() {
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();
  const router = useRouter();
  const [openId, setOpenId] = useState<HealthConcernId | null>(null);

  const ranked = useMemo(() => {
    // Profil hali yo'q bo'lsa — neytral, hammaga tegishli ro'yxat.
    const profile = onboardingProfile;
    return rankHealthConcerns({
      age: profile?.age ?? 25,
      isPregnant: profile?.isPregnant ?? false,
      cycleRegularity: profile?.cycleRegularity ?? "regular",
      healthConditions: profile?.healthConditions ?? [],
      hasGivenBirth: profile?.hasGivenBirth ?? null,
      hormonalContraception: profile?.hormonalContraception ?? null,
      bmi: bmiFrom(profile?.heightCm ?? null, profile?.weightKg ?? null),
    });
  }, [onboardingProfile]);

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader title={dict.concerns.title} subtitle={dict.concerns.subtitle} />
      <p className="-mt-2 text-xs text-text-muted">{dict.concerns.disclaimer}</p>

      <div className="space-y-3">
        {ranked.map(({ rule, highlighted }, index) => {
          const info = dict.concerns.items[rule.id];
          const isOpen = openId === rule.id;
          return (
            <Reveal key={rule.id} index={index}>
              <Card className="space-y-0 p-0!">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : rule.id)}
                  aria-expanded={isOpen}
                  className="tap-target flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-text-primary">{info.title}</span>
                    {highlighted && (
                      <span className="mt-1.5 inline-block">
                        <Badge tone="primary">{dict.concerns.highlightedLabel}</Badge>
                      </span>
                    )}
                  </span>
                  <ExpandMoreRounded
                    sx={{ fontSize: 22 }}
                    className={clsx("mt-0.5 shrink-0 text-text-muted transition-transform", isOpen && "rotate-180")}
                  />
                </button>

                {isOpen && (
                  <div className="space-y-4 border-t border-border px-4 py-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{dict.concerns.whatLabel}</p>
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{info.what}</p>
                    </div>

                    {/* Qizil bayroqlar — eng muhim blok. Ayol boshqa hech
                        narsani o'qimasa ham SHUNI ko'rishi kerak, shuning
                        uchun alohida rangda ajratilgan. */}
                    <div className="rounded-2xl border border-danger/20 bg-danger/5 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-danger">
                        <WarningAmberRounded sx={{ fontSize: 16 }} />
                        {dict.concerns.urgentLabel}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{info.urgent}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{dict.concerns.relatedCheckupsLabel}</p>
                      <ul className="mt-1.5 space-y-1">
                        {rule.relatedCheckups.map((type) => (
                          <li key={type} className="flex gap-2 text-sm text-text-secondary">
                            <span aria-hidden className="text-text-muted">
                              •
                            </span>
                            {dict.checklist.items[type].title}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-sm text-text-secondary">
                      <span className="font-semibold text-text-primary">{dict.concerns.specialistLabel}:</span>{" "}
                      {dict.concerns.specialists[rule.specialist]}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {/* BRIDGE: yordamchiga tayyor savol bilan o'tadi —
                          ayol savolni qaytadan ta'riflab o'tirmasin. */}
                      <Button variant="secondary" onClick={() => router.push(`/yordamchi?q=${encodeURIComponent(info.title)}`)}>
                        {dict.concerns.askAssistantButton}
                      </Button>
                      <Button variant="ghost" onClick={() => router.push(`/klinikalar?specialty=${rule.specialist}`)}>
                        {dict.concerns.findClinicButton}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </Reveal>
          );
        })}
      </div>

      <Button variant="ghost" onClick={() => router.push("/tekshiruvlar")} className="w-full">
        {dict.concerns.openChecklistButton}
      </Button>
    </div>
  );
}
