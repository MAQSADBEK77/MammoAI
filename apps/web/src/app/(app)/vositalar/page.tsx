"use client";

import { useRouter } from "next/navigation";
import {
  ArticleOutlined,
  FavoriteBorderOutlined,
  InsightsOutlined,
  LocationOnOutlined,
  MedicalInformationOutlined,
  QuizOutlined,
  SpaOutlined,
} from "@mui/icons-material";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { ScreenHeader } from "@/components/ui";

/**
 * NAV-02 — "Vositalar" markazi.
 *
 * Nega kerak: ilovaning yarmi bosh ekranning pastida, uzun karta
 * ro'yxati ichida yashiringan edi. Maqolalarga 30 kunda atigi 15 ayol
 * yetib borgan — 16 ta maqola bo'lishiga qaramay. Klinikalar, hisobot
 * va xavf testi ham xuddi shunday: ular bor, lekin ularni topish uchun
 * bosh ekranni oxirigacha aylantirish kerak edi.
 *
 * Naqsh Lalu ("Muhim" bo'limi) va Mom+ ("Barcha vositalar") dan olindi:
 * ikkalasi ham 4 ta tab ishlatadi va qolgan hamma narsani BITTA
 * ko'rinadigan panjaraga yig'adi. Farq shundaki, bizning panjaramizning
 * birinchi qatori — tekshiruv va hisobot, ya'ni bizning va'damiz.
 *
 * Har plitka bitta manzil. Hech qanday "yana" yoki ichki daraja yo'q:
 * ikki bosishdan uzoq narsa amalda topilmaydi.
 */
export default function ToolsPage() {
  const router = useRouter();
  const { dict } = useI18n();
  const { onboardingProfile } = useSession();
  const t = dict.tools;

  const isPartnerTracking = onboardingProfile?.primaryGoal === "partner_tracking";

  const tiles = [
    { href: "/maqolalar", label: t.articles, hint: t.articlesHint, Icon: ArticleOutlined, tint: "bg-primary/10", fg: "text-primary" },
    { href: "/klinikalar", label: t.clinics, hint: t.clinicsHint, Icon: LocationOnOutlined, tint: "bg-accent/10", fg: "text-accent" },
    { href: "/hisobot", label: t.report, hint: t.reportHint, Icon: MedicalInformationOutlined, tint: "bg-secondary/10", fg: "text-secondary" },
    { href: "/statistika", label: t.stats, hint: t.statsHint, Icon: InsightsOutlined, tint: "bg-primary/10", fg: "text-primary" },
    { href: "/xavf-testi", label: t.riskQuiz, hint: t.riskQuizHint, Icon: QuizOutlined, tint: "bg-warning/10", fg: "text-warning" },
    { href: "/muammolar", label: t.concerns, hint: t.concernsHint, Icon: SpaOutlined, tint: "bg-accent/10", fg: "text-accent" },
    // Hamkorini kuzatuvchilarda "Juft" pastki menyuda turadi — bu yerda
    // takrorlash shart emas.
    ...(isPartnerTracking
      ? []
      : [{ href: "/hamkor", label: t.partner, hint: t.partnerHint, Icon: FavoriteBorderOutlined, tint: "bg-secondary/10", fg: "text-secondary" }]),
  ];

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid grid-cols-2 gap-3">
        {tiles.map(({ href, label, hint, Icon, tint, fg }) => (
          <button
            key={href}
            type="button"
            onClick={() => router.push(href)}
            className="flex flex-col items-start gap-2 rounded-3xl bg-surface p-4 text-left shadow-sm transition active:scale-[0.98]"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tint}`}>
              <Icon sx={{ fontSize: 22 }} className={fg} />
            </span>
            <span className="text-sm font-bold leading-snug text-text-primary">{label}</span>
            <span className="text-xs leading-snug text-text-secondary">{hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
