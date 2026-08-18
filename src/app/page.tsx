import { Activity, ClipboardList, LineChart, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import { LinkButton } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { StatCounter } from "@/components/StatCounter";

const STEPS = [
  {
    icon: UserPlus,
    title: "1. Ro'yxatdan o'ting",
    text: "Ism, familiya, tug'ilgan sana va boshqa ma'lumotlaringiz bilan bir necha soniyada shaxsiy kabinet oching.",
  },
  {
    icon: ClipboardList,
    title: "2. Testni topshiring",
    text: "Qisqa savollar orqali ko'krak saratoni xavf omillarini baholovchi testdan o'ting.",
  },
  {
    icon: LineChart,
    title: "3. Natijani oling",
    text: "Xavf darajangizni (past, o'rta, yuqori) ko'ring va zarur bo'lsa shifokorga murojaat qiling.",
  },
];

const FEATURES = [
  {
    icon: Activity,
    title: "Ilmiy asoslangan savollar",
    text: "Xavf omillariga asoslangan savollar to'plami mutaxassislar bilan kelishilgan holda yangilanib boriladi.",
  },
  {
    icon: ShieldCheck,
    title: "Maxfiylik",
    text: "Shaxsiy va tibbiy ma'lumotlaringiz faqat siz va vakolatli shifokorlar uchun ko'rinadi.",
  },
  {
    icon: Sparkles,
    title: "Tezkor natija",
    text: "Testni yakunlagach xavf darajangiz va tavsiyalar darhol ekranda ko'rsatiladi.",
  },
];

const STATS = [
  { value: 8, prefix: "1/", suffix: "", label: "Ayoldan bittasi umri davomida ko'krak saratoniga duch kelishi mumkin" },
  { value: 99, prefix: "", suffix: "%", label: "Erta bosqichda aniqlansa, 5 yillik omon qolish darajasi shu ko'rsatkichga yetishi mumkin" },
  { value: 10, prefix: "", suffix: " daqiqa", label: "Xavf darajangizni bilish uchun shuncha vaqt kifoya" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 50% 0%, rgba(59,130,246,0.25), transparent 70%)",
          }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-pink-500/10 px-4 py-1.5 text-xs font-medium text-pink-200">
            <span aria-hidden>🎗️</span>
            Ko&apos;krak saratoniga qarshi kurash harakati
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            <Logo size="lg" />
          </div>
          <h2
            className="animate-fade-in-up mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "160ms" }}
          >
            Ko&apos;krak saratonini erta aniqlang,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              hayot saqlang
            </span>
          </h2>
          <p
            className="animate-fade-in-up mt-5 max-w-xl text-base text-blue-200/80 sm:text-lg lg:text-xl"
            style={{ animationDelay: "240ms" }}
          >
            MammoAI — bir necha daqiqada xavf omillaringizni baholab,
            natijangizni ko&apos;rsatuvchi onlayn tekshiruv tizimi. Ro&apos;yxatdan
            o&apos;ting va bugunoq testdan o&apos;ting.
          </p>
          <div
            className="animate-fade-in-up mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "320ms" }}
          >
            <LinkButton href="/sign-up">
              <UserPlus size={16} />
              Ro&apos;yxatdan o&apos;tish
            </LinkButton>
            <LinkButton href="/login" variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              Kirish
            </LinkButton>
          </div>
          <p
            className="animate-fade-in-up mt-6 max-w-lg text-xs text-blue-300/60"
            style={{ animationDelay: "380ms" }}
          >
            Diqqat: bu tizim faqat dastlabki xabardorlik uchun mo&apos;ljallangan
            va tibbiy tashxis o&apos;rnini bosmaydi. Har qanday alomat yoki
            xavotir bo&apos;lsa shifokorga murojaat qiling.
          </p>
        </div>
      </section>

      {/* Awareness stats */}
      <section className="border-b border-slate-100 bg-white px-4 py-16 sm:px-6 lg:px-8 dark:border-slate-900 dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 120} className="text-center">
              <p className="bg-gradient-to-br from-pink-500 to-blue-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                <StatCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
              <p className="mx-auto mt-2 max-w-[22rem] text-sm text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal className="mx-auto max-w-xl text-center">
          <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
            Bu qanday ishlaydi?
          </h3>
          <p className="mt-2 text-slate-500 lg:text-lg dark:text-slate-400">
            Uch qadamda xavf darajangizni bilib oling.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-3 lg:mt-16 lg:gap-8">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 120}>
              <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg lg:p-8 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-900/20 transition-transform group-hover:scale-110">
                  <step.icon size={20} className="text-white" />
                </div>
                <h4 className="mt-4 font-semibold text-slate-900 lg:text-lg dark:text-white">
                  {step.title}
                </h4>
                <p className="mt-1.5 text-sm text-slate-500 lg:text-base dark:text-slate-400">
                  {step.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-28 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-xl text-center">
            <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
              Nega MammoAI?
            </h3>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-3 lg:mt-16 lg:gap-8">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 120}>
                <div className="group h-full rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg lg:p-8 dark:bg-slate-900">
                  <f.icon size={22} className="text-blue-600 transition-transform group-hover:scale-110 dark:text-blue-400" />
                  <h4 className="mt-3 font-semibold text-slate-900 lg:text-lg dark:text-white">
                    {f.title}
                  </h4>
                  <p className="mt-1.5 text-sm text-slate-500 lg:text-base dark:text-slate-400">
                    {f.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto flex max-w-5xl flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-14 text-center shadow-xl shadow-blue-900/20 lg:py-20">
          <h3 className="text-2xl font-bold text-white sm:text-3xl">
            Bugun sog&apos;ligingiz haqida qadam tashlang
          </h3>
          <p className="max-w-md text-sm text-blue-100">
            Ro&apos;yxatdan o&apos;ting, testni topshiring va xavf darajangizni
            bilib oling — bu bir necha daqiqa vaqtingizni oladi.
          </p>
          <LinkButton
            href="/sign-up"
            className="mt-2 bg-white text-blue-700 hover:bg-blue-50"
          >
            Hoziroq boshlash
          </LinkButton>
        </Reveal>
      </section>

      <footer className="border-t border-slate-200 px-4 py-8 text-center text-xs text-slate-400 sm:px-6 dark:border-slate-800 dark:text-slate-500">
        <span aria-hidden className="mr-1">🎗️</span>
        © {new Date().getFullYear()} MammoAI. Barcha huquqlar himoyalangan.
      </footer>
    </div>
  );
}
