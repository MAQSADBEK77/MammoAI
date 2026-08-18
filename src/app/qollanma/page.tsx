import {
  AlertTriangle,
  Calendar,
  Eye,
  Hand,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LinkButton } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

const STEPS = [
  {
    icon: Calendar,
    title: "1. To'g'ri vaqtni tanlang",
    text: "Agar hayz ko'rayotgan bo'lsangiz, hayzdan 3–5 kun o'tgach ko'kraklar eng yumshoq bo'ladi. Menopauzadan keyin bo'lsangiz, har oy bir xil sanani tanlang — masalan, oyning 1-kuni.",
  },
  {
    icon: Eye,
    title: "2. Ko'zguda ko'zdan kechiring",
    text: "Yelkalaringizni tik tutib turing, so'ng qo'llaringizni yon tomonga tushiring va boshingiz uzra ko'taring. Ko'krak shakli, o'lchami yoki teri holatida o'zgarish bor-yo'qligini kuzating.",
  },
  {
    icon: Hand,
    title: "3. Turgan yoki o'tirgan holda tekshiring",
    text: "Dush paytida, sovunlangan barmoq uchlari bilan ko'krakni tashqaridan ichkariga qarab aylana harakatlar bilan bosib tekshiring.",
  },
  {
    icon: Hand,
    title: "4. Yotgan holda tekshiring",
    text: "Yelka ostiga yostiq qo'yib yoting, bir qo'lni bosh ostiga qo'ying. Ikkinchi qo'l barmoqlari bilan butun ko'krak yuzasini tizimli — masalan, soat strelkasi bo'yicha — aylanib tekshiring.",
  },
  {
    icon: ShieldAlert,
    title: "5. Ko'krak uchi va qo'ltiq ostini tekshiring",
    text: "Ko'krak uchini ohista bosib, g'ayrioddiy suyuqlik ajralmayotganiga ishonch hosil qiling. Qo'ltiq osti sohasida shish yoki tugun yo'qligini tekshiring.",
  },
];

const WARNING_SIGNS = [
  "Ko'krakda yoki qo'ltiq ostida yangi shish, tugun yoki qattiqlashish",
  "Ko'krak shakli yoki o'lchamidagi tushunarsiz o'zgarish",
  "Teri bujmayishi, chuqurchalanishi yoki qizarishi",
  "Ko'krak uchining ichiga tortilishi yoki shaklining o'zgarishi",
  "Sut bilan bog'liq bo'lmagan suyuqlik ajralishi",
  "Uzoq davom etadigan og'riq yoki noqulaylik",
];

export default function GuidePage() {
  return (
    <div className="flex min-h-full flex-col bg-white dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-pink-50 px-4 py-1.5 text-xs font-medium text-pink-700 dark:bg-pink-500/10 dark:text-pink-300">
            <span aria-hidden>🎗️</span>
            O&apos;z-o&apos;zini tekshirish qo&apos;llanmasi
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">
            Ko&apos;kragingizni har oy tekshirib turing
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
            Muntazam o&apos;z-o&apos;zini tekshirish orqali ko&apos;kragingizning odatiy
            holatini bilib olasiz — shunda har qanday o&apos;zgarishni erta payqash
            osonlashadi.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-8 flex items-start gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>
            Bu qo&apos;llanma faqat umumiy ma&apos;lumot beradi va professional tibbiy
            ko&apos;rik (mammografiya, shifokor tekshiruvi) o&apos;rnini bosmaydi.
            O&apos;z-o&apos;zini tekshirish qo&apos;shimcha vosita, yagona usul emas.
          </p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 90}>
              <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-900/20">
                  <step.icon size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{step.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <AlertTriangle size={18} className="text-amber-500" />
            Quyidagilarni sezsangiz, shifokorga murojaat qiling
          </h2>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {WARNING_SIGNS.map((sign) => (
              <li
                key={sign}
                className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {sign}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={160} className="mt-12 flex flex-col items-center gap-3 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-10 text-center shadow-xl shadow-blue-900/20">
          <Sparkles size={22} className="text-blue-200" />
          <h3 className="text-xl font-bold text-white">Xavf omillaringizni ham bilib oling</h3>
          <p className="max-w-md text-sm text-blue-100">
            O&apos;z-o&apos;zini tekshirishga qo&apos;shimcha ravishda, qisqa testdan o&apos;tib
            umumiy xavf darajangizni ham baholang.
          </p>
          <LinkButton href="/test" className="mt-1 bg-white text-blue-700 hover:bg-blue-50">
            Testni boshlash
          </LinkButton>
        </Reveal>
      </main>
    </div>
  );
}
