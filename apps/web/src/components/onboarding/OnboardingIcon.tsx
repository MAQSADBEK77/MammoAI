/**
 * ONB-07 — MammoAI onboarding belgilarining O'Z to'plami.
 *
 * NEGA ALMASHTIRILDI:
 *   1) MUI tizim ikonkalari — Google'ning interfeys belgilari. Toza, lekin
 *      rasmiy va begona; ba'zilari kontekstga umuman mos emas edi (oilaviy
 *      tarix uchun hojatxona belgisi, simptomlar uchun klinik termometr).
 *   2) Emoji (Twemoji) — iliq, lekin ular BIZNING emas. Har qanday ilovada
 *      bor va brend hissini bermaydi.
 *
 * BU TO'PLAMNING AFZALLIGI: belgilar `currentColor`da chizilgan, ya'ni
 * onboarding bo'limining rangini (binafsha / pushti / turkuaz) O'ZI oladi.
 * Emoji rangi qat'iy — u bilan bunday qilib bo'lmaydi.
 *
 * USLUB QOIDALARI (izchillik uchun, yangi belgi qo'shilsa ham saqlanadi):
 *   • 48×48 viewBox;
 *   • chiziq qalinligi 2.6, uchlari va burilishlari YUMALOQ (`round`) —
 *     iliqlik shundan keladi, o'tkir burchaklar rasmiy ko'rinadi;
 *   • asosiy shakl chiziqli, ikkinchi darajali detal `opacity` bilan
 *     to'ldirilgan — shunda belgi "og'ir" bo'lib qolmaydi;
 *   • hech qanday matn, hech qanday gradient.
 *
 * CHEKLOV — halol aytilishi kerak: bu belgilar to'plami, PERSONAJ
 * illyustratsiyasi emas. Foydalanuvchi bergan referenslardagi kabi
 * (soch, yuz, qo'l harakati bilan) ayol personaji kod bilan chizilganda
 * sun'iy chiqadi va brendga zarar beradi. Bunday illyustratsiyalar
 * dizayner tomonidan (Figma) chizilib, `illustration_slots` orqali
 * qo'yilishi kerak — ular uchun tizim allaqachon bor.
 */

export type OnboardingIconName =
  | "welcome"
  | "privacy"
  | "name"
  | "age"
  | "cycle"
  | "symptoms"
  | "family"
  | "intimacy"
  | "measure";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Kirish — ochiq eshik va yo'l. "Ichkariga marhamat" ma'nosi. */
function Welcome() {
  return (
    <>
      <path d="M28 8h10a2 2 0 0 1 2 2v28a2 2 0 0 1-2 2H28" {...S} />
      <path d="M8 24h16" {...S} />
      <path d="M17 17l7 7-7 7" {...S} />
      <circle cx="33" cy="24" r="1.8" fill="currentColor" />
    </>
  );
}

/** Maxfiylik — qalqon, ichida yurak. Himoya + g'amxo'rlik, sovuq "qulf" emas. */
function Privacy() {
  return (
    <>
      <path d="M24 6l14 5v12c0 9-6 15.5-14 18-8-2.5-14-9-14-18V11l14-5z" {...S} />
      <path d="M24 30s-6-3.8-6-8a3.5 3.5 0 0 1 6-2.3A3.5 3.5 0 0 1 30 22c0 4.2-6 8-6 8z" fill="currentColor" opacity="0.28" />
    </>
  );
}

/** Ism — yumshoq yorqinlik. "Sizni tanib olamiz" lahzasi. */
function Name() {
  return (
    <>
      <path d="M24 8l3.2 8.8L36 20l-8.8 3.2L24 32l-3.2-8.8L12 20l8.8-3.2L24 8z" {...S} />
      <circle cx="36" cy="34" r="2.6" fill="currentColor" opacity="0.4" />
      <circle cx="13" cy="35" r="1.8" fill="currentColor" opacity="0.28" />
    </>
  );
}

/** Yosh — bitta shamli tort. Bayram ohangi, "tug'ilgan yil" savoliga mos. */
function Age() {
  return (
    <>
      <path d="M24 9v5" {...S} />
      <path d="M24 6.5c1.6 1.3 1.6 2.6 0 3.4-1.6-.8-1.6-2.1 0-3.4z" fill="currentColor" />
      <path d="M11 22h26a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V24a2 2 0 0 1 2-2z" {...S} />
      <path d="M9 30c3.5 0 3.5-3 7-3s3.5 3 7 3 3.5-3 7-3 3.5 3 7 3" {...S} opacity="0.45" />
    </>
  );
}

/** Sikl — yarim oy va uni o'rab turgan nuqtali aylana. Takrorlanuvchi
 * tabiiy sikl ma'nosi; "qayta yuklash" strelkasidan ancha mosroq. */
function Cycle() {
  return (
    <>
      <path d="M27 11a13 13 0 1 0 10 20 15 15 0 0 1-10-20z" fill="currentColor" opacity="0.3" />
      <path d="M27 11a13 13 0 1 0 10 20 15 15 0 0 1-10-20z" {...S} />
      <circle cx="24" cy="24" r="19" {...S} strokeDasharray="2 6" opacity="0.5" />
    </>
  );
}

/** Simptomlar — yurak va uning ritmi. G'amxo'rlik ohangi, klinik emas. */
function Symptoms() {
  return (
    <>
      <path d="M24 39s-14-8.4-14-18.5C10 15 14 11 19 11c2.3 0 4 1 5 2.4 1-1.4 2.7-2.4 5-2.4 5 0 9 4 9 9.5 0 2.3-.7 4.5-1.9 6.5" {...S} />
      <path d="M10 27h6l3-5 4 10 3-5h11" {...S} />
    </>
  );
}

/** Oilaviy tarix — ikkita avlod (katta va kichik figura). */
function Family() {
  return (
    <>
      <circle cx="18" cy="14" r="5.5" {...S} />
      <path d="M8 38c0-6 4.5-10 10-10s10 4 10 10" {...S} />
      <circle cx="34" cy="20" r="4" {...S} opacity="0.55" />
      <path d="M27 38c0-4.4 3.1-7.5 7-7.5s7 3.1 7 7.5" {...S} opacity="0.55" />
    </>
  );
}

/** Yaqinlik — bir-biriga bog'langan ikkita yurak. */
function Intimacy() {
  return (
    <>
      <path d="M19 33s-9-5.4-9-11.8C10 17.4 12.6 15 15.8 15c2 0 3.2 1 3.2 1" {...S} />
      <path d="M19 33s9-5.4 9-11.8C28 17.4 25.4 15 22.2 15c-2 0-3.2 1-3.2 1" {...S} />
      <path d="M31 36s7-4.2 7-9.2C38 23.9 36 22 33.5 22c-1.5 0-2.5.8-2.5.8" {...S} opacity="0.5" />
      <path d="M31 36s-7-4.2-7-9.2C24 23.9 26 22 28.5 22c1.5 0 2.5.8 2.5.8" {...S} opacity="0.5" />
    </>
  );
}

/** Bo'y va vazn — o'lchov chizig'i. Neytral, tibbiy tarozi emas. */
function Measure() {
  return (
    <>
      <path d="M10 16h28a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2z" {...S} />
      <path d="M16 16v6M24 16v9M32 16v6" {...S} opacity="0.55" />
    </>
  );
}

const ICONS: Record<OnboardingIconName, () => React.ReactElement> = {
  welcome: Welcome,
  privacy: Privacy,
  name: Name,
  age: Age,
  cycle: Cycle,
  symptoms: Symptoms,
  family: Family,
  intimacy: Intimacy,
  measure: Measure,
};

export function OnboardingIcon({ name, size = 52 }: { name: OnboardingIconName; size?: number }) {
  const Icon = ICONS[name];
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} role="presentation">
      <Icon />
    </svg>
  );
}
