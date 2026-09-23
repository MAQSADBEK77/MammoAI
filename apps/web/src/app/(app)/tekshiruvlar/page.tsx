"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { ChecklistCategory, ChecklistItem, ChecklistResponse } from "@mammoai/shared";
import { formatDateDisplay, CHECKUP_CATEGORY, CHECKUP_OFFICIAL_TRACK } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { ProfileQuestionsCard } from "@/components/screens/ProfileQuestionsCard";
import { useIllustrations } from "@/lib/illustrations";
import { api } from "@/lib/api";
import { Badge, Button, Card, LoadingSpinner, ErrorState, EmptyState, ScreenHeader, StatTile } from "@/components/ui";
import { CheckCircleOutlined, AccessTimeOutlined, ErrorOutlineOutlined } from "@mui/icons-material";
import { Reveal } from "@/components/motion-primitives";

const STATUS_ICON = { pending: AccessTimeOutlined, done: CheckCircleOutlined, overdue: ErrorOutlineOutlined } as const;
const STATUS_ICON_COLOR = { pending: "text-text-muted", done: "text-success", overdue: "text-danger" } as const;

// FIX-CHECKUPS: turlar soni 7'dan 30'ga chiqqach bitta tekis, sana bo'yicha
// saralangan ro'yxat endi ko'z bilan kuzatib bo'lmaydigan darajada uzun —
// bo'limlarga guruhlash uchun ko'rsatish tartibi.
const CATEGORY_ORDER: ChecklistCategory[] = [
  "screening",
  "lab",
  "imaging",
  "vaccination",
  "consultation",
  "self_exam",
  "pregnancy",
  "postpartum",
];

function groupByCategory(items: ChecklistItem[]): { category: ChecklistCategory; items: ChecklistItem[] }[] {
  const groups = new Map<ChecklistCategory, ChecklistItem[]>();
  for (const item of items) {
    const category = CHECKUP_CATEGORY[item.type];
    const list = groups.get(category);
    if (list) list.push(item);
    else groups.set(category, [item]);
  }
  return CATEGORY_ORDER.filter((c) => groups.has(c)).map((category) => ({ category, items: groups.get(category)! }));
}

export default function ChecklistPage() {
  const { dict } = useI18n();
  const { onboardingProfile, refresh } = useSession();
  const { resolve } = useIllustrations();
  const router = useRouter();
  const [data, setData] = useState<ChecklistResponse | null>(null);
  // MOTION-APP-03: "bajarildi" bosilganda holat-belgisining qisqa "pop"i —
  // mikro-tasdiq (Jamiyat'dagi layk-pop bilan bir xil umumiy klass).
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  // UX-01: ilgari api.checklist.list() muvaffaqiyatsiz bo'lsa `data` HECH
  // QACHON to'lmasdi — ekran CHEKSIZ "yuklanmoqda" holatida qolib ketardi.
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    api.checklist.list().then(setData).catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  if (loadError) {
    return <ErrorState message={dict.common.errorGeneric} retry={{ label: dict.common.retryButton, onClick: load }} />;
  }
  if (!data) return <LoadingSpinner label={dict.common.loading} />;
  const { readOnly, emptyReason, partnerName } = data;
  // FIX-UX-03: yangi UNIQUE indeks (db.ts) va ON CONFLICT (repo.ts) endi
  // YANGI dublikatlarning oldini oladi, lekin migratsiyadan oldin
  // yaratilgan eski dublikat qatorlar hali ba'zi hisoblarda qolgan bo'lishi
  // mumkin — himoya sifatida, bir xil `type`dan faqat ENG SO'NGGISINI
  // (createdAt bo'yicha) ko'rsatamiz, aks holda "buni qildimmi yoki
  // yo'qmi?" degan chalkashlik yuzaga kelardi.
  const items = Object.values(
    Object.fromEntries(
      [...data.items].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((item) => [item.type, item])
    )
  );

  async function complete(id: string) {
    // FIX2-29: ilgari serverdan qaytgan BUTUN ro'yxat bilan almashtirilardi
    // — ikkita turli itemni tez ketma-ket "Bajardim" qilsangiz, javoblar
    // so'rov tartibida emas, TARMOQ tartibida qaytishi mumkin edi; sekinroq
    // javob keyinroq kelib, ikkinchi itemni vizual ravishda "bajarilmagan"ga
    // qaytarib qo'yardi. Endi faqat SHU itemning holati optimistik va
    // to'g'ridan-to'g'ri yangilanadi — serverning to'liq snapshot javobiga
    // umuman tayanilmaydi, shuning uchun boshqa itemning holati bilan
    // hech qachon to'qnashmaydi.
    const previousStatus = data?.items.find((item) => item.id === id)?.status;
    setData((prev) =>
      prev ? { ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, status: "done", completedAt: new Date().toISOString() } : item)) } : prev
    );
    setJustCompletedId(id);
    window.setTimeout(() => setJustCompletedId((cur) => (cur === id ? null : cur)), 400);
    try {
      await api.checklist.complete(id);
    } catch {
      // So'rov muvaffaqiyatsiz bo'lsa — optimistik yangilanishni ortga qaytaramiz.
      setData((prev) =>
        prev && previousStatus
          ? { ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, status: previousStatus, completedAt: null } : item)) }
          : prev
      );
    }
  }

  const statusTone = { pending: "muted", done: "success", overdue: "danger" } as const;
  const statusLabel = {
    pending: dict.checklist.statusPending,
    done: dict.checklist.statusDone,
    overdue: dict.checklist.statusOverdue,
  } as const;

  const doneCount = items.filter((i) => i.status === "done").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const overdueCount = items.filter((i) => i.status === "overdue").length;

  // MOTION-APP-03: ro'yxat bo'lim(kategoriya)larga guruhlangan bo'lsa ham,
  // stagger butun sahifa bo'ylab UZLUKSIZ his qilinishi uchun — har bir
  // band o'z GURUHIGA emas, BUTUN ro'yxatdagi o'rniga qarab kechikadi.
  const groupedItems = groupByCategory(items);
  const staggerIndexById = new Map<string, number>();
  {
    let i = 0;
    for (const group of groupedItems) for (const item of group.items) staggerIndexById.set(item.id, i++);
  }

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader title={readOnly && partnerName ? dict.checklist.partnerTitle(partnerName) : dict.checklist.title} />

      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
        <img src={resolve("screen.tekshiruvlar")} alt="" className="h-32 w-auto" />
      </div>

      {readOnly && emptyReason ? (
        <Card className="text-center text-sm text-text-secondary">
          {emptyReason === "not_linked" ? dict.checklist.partnerNotLinked : dict.checklist.partnerNotShared}
        </Card>
      ) : (
        <div className="animate-fade-in-up flex gap-2.5">
          <StatTile icon={<CheckCircleOutlined sx={{ fontSize: 16 }} />} label={statusLabel.done} value={String(doneCount)} tone="accent" active />
          <StatTile icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />} label={statusLabel.pending} value={String(pendingCount)} tone="secondary" active />
          <StatTile icon={<ErrorOutlineOutlined sx={{ fontSize: 16 }} />} label={statusLabel.overdue} value={String(overdueCount)} tone="primary" active />
        </div>
      )}

      {/* PROFILE-01 — ro'yxatni aniqlashtiruvchi savollar. Aynan SHU YERDA,
          ro'yxatning USTIDA: savolning foydasi ("quyidagi ro'yxat aniqroq
          bo'ladi") darhol ko'rinib turadi. Onboarding'da so'ralsa, bu bog'
          ko'rinmasdi va savol shunchaki yana bir to'siq bo'lardi.
          Hamkorning ro'yxatini ko'rayotganda ko'rsatilmaydi — savollar
          FOYDALANUVCHINING O'ZI haqida. */}
      {!readOnly && onboardingProfile && (
        <ProfileQuestionsCard
          profile={onboardingProfile}
          onSaved={() => {
            // Javob ro'yxatni o'zgartiradi (server allaqachon qayta
            // hisobladi), shuning uchun ikkalasi ham yangilanadi: sessiya —
            // profil va menyudagi belgi uchun, `load` — ro'yxat uchun.
            void refresh();
            load();
          }}
        />
      )}

      {/* O'z-o'zini tekshirish testi — faqat o'zining checklist'i uchun,
          hamkorining ro'yxatini ko'rayotganda ma'nosiz (bu shaxsiy xavf testi). */}
      {!readOnly && (
        <button onClick={() => router.push("/xavf-testi")} className="block w-full text-left">
          <Card interactive>
            <p className="font-semibold text-text-primary">{dict.checklist.riskQuizCardTitle}</p>
          </Card>
        </button>
      )}

      {!readOnly && items.length === 0 && <EmptyState title={dict.checklist.emptyTitle} message={dict.checklist.emptyMessage} />}

      {groupedItems.map(({ category, items: groupItems }) => (
        <div key={category} className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{dict.checklist.categoryLabels[category]}</p>
          <div className="space-y-3">
            {groupItems.map((item) => {
              const info = dict.checklist.items[item.type];
              const StatusIcon = STATUS_ICON[item.status];
              // FIX3-05: ilgari yosh tekshiruvisiz ko'rsatilardi — masalan
              // 20 yoshli foydalanuvchi "Rasmiy dastur: 35-55 yosh" degan
              // (o'ziga aloqasi yo'q) belgini ko'rib, "35 yoshgacha kerak
              // emas" deb noto'g'ri tushunishi mumkin edi. Endi faqat
              // foydalanuvchi HAQIQATAN shu yosh oralig'ida bo'lsagina
              // ko'rsatiladi (hamkorning ro'yxatini ko'rayotganda — o'z
              // yoshi bilan hamkorning yoshini aralashtirmaslik uchun —
              // umuman ko'rsatilmaydi).
              const officialTrack = CHECKUP_OFFICIAL_TRACK[item.type];
              const showOfficialTrack =
                officialTrack &&
                !readOnly &&
                onboardingProfile != null &&
                onboardingProfile.age >= officialTrack.minAge &&
                onboardingProfile.age <= officialTrack.maxAge;
              return (
                <Reveal key={item.id} index={staggerIndexById.get(item.id) ?? 0}>
                <Card className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex items-start gap-2.5 font-semibold text-text-primary">
                      <span
                        className={clsx(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-current/10",
                          STATUS_ICON_COLOR[item.status],
                          justCompletedId === item.id && "animate-pop-bounce"
                        )}
                      >
                        <StatusIcon sx={{ fontSize: 16 }} />
                      </span>
                      <span className="pt-1">{info.title}</span>
                    </p>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge>
                      <Badge tone={item.isFree ? "success" : "warning"}>{item.isFree ? dict.common.free : dict.common.paid}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary">{info.why}</p>
                  {/* FIX-CHECKUPS: davlat dasturi bo'yicha majburiy oyna
                      tavsiya etilgandan farq qiladigan bandlar uchun —
                      ma'lumot xarakterida, muddat hisobiga ta'sir qilmaydi. */}
                  {showOfficialTrack && (
                    <p className="text-xs text-text-muted">
                      {dict.checklist.officialTrackLabel(officialTrack.minAge, officialTrack.maxAge, dict.checklist.frequencyLabels[officialTrack.frequency])}
                    </p>
                  )}
                  {item.dueDate && item.status !== "done" && (
                    <p className="text-xs text-text-muted">{formatDateDisplay(item.dueDate)}</p>
                  )}
                  {!readOnly && item.status !== "done" && (
                    <div className="flex gap-2 pt-1">
                      <Button variant="secondary" onClick={() => complete(item.id)}>
                        {dict.checklist.markDoneButton}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => router.push(`/asosiy?checklistItemId=${item.id}`)}
                      >
                        {dict.checklist.findClinicButton}
                      </Button>
                    </div>
                  )}
                </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
