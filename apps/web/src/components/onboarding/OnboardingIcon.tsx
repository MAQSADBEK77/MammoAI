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
  | "measure"
  // ONB-GOALS-01 — maqsad ro'yxati uchun.
  | "goal_cycle"
  | "goal_pregnancy"
  | "goal_planning"
  | "goal_wellbeing"
  | "goal_checkups"
  | "goal_body"
  | "goal_skin"
  | "goal_partner"
  | "goal_perimenopause";

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

/** Maxfiylik — qalqon, ichida BRENDNING O'Z belgisi.
 *
 * ONB-BRAND-01 (foydalanuvchi so'rovi): ilgari qalqon ichida oddiy yurak
 * bor edi — chiroyli, lekin uni istalgan ilovada uchratish mumkin. Endi
 * ichida "m" belgisi turadi, ya'ni ekran "sizning ma'lumotingizni MAMMOAI
 * himoya qiladi" deb aytadi, "kimdir himoya qiladi" deb emas. */
function Privacy() {
  return (
    <>
      <path d="M24 6l14 5v12c0 9-6 15.5-14 18-8-2.5-14-9-14-18V11l14-5z" {...S} />
      {/* Ichma-ich SVG — brend belgisining o'z viewBox'i boshqa, shuning
          uchun uni shu yerda qayta o'lchaymiz. `currentColor` saqlanadi,
          ya'ni belgi bo'lim rangini oladi. */}
      <svg x="14" y="17" width="20" height="11" viewBox="606 342 708 396" fill="currentColor" opacity="0.85">
        <path d="M648.57,614.61c-3.06-16.14-3.59-36.22-0.16-61.19c0.07-0.5,0.12-1,0.17-1.51c1.21-13.14,28.7-231.25,228.01-114.3c11.19,6.57,25.19,6.04,35.79-1.44c43.86-30.96,163.49-91.38,228.61,96.53c1.59,0.12,17.37,100.82,89.25,77.16c21.51-7.08,43.7,8.64,43.7,31.29v0c0,15.2-10.36,28.43-25.11,32.09c-46.98,11.64-146.06,15.92-175.39-141.64c-0.52-2.82-1.38-5.56-2.6-8.15c-7.76-16.56-40.83-80.09-105.01-48.04c-3.09,1.54-5.92,3.55-8.39,5.96c-7.95,7.78-31.44,31.94-29.91,78.62c0.71,21.54,0.88,44.01,0.82,63.65c-0.11,37.21-52.51,46-64.29,10.7c-0.73-2.19-1.4-4.49-1.98-6.9c-0.73-2.99-0.96-6.06-0.8-9.13c3.02-57.81,11.14-159.99-83.77-150.83c-2.8,0.27-5.56,0.9-8.21,1.84c-10.45,3.72-60.73,16.66-55.3,107.51c0.04,0.63,0.06,1.26,0.06,1.89v29.59C714.08,648.36,656.02,653.95,648.57,614.61z" />
      </svg>
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


/* ─────────────────────────────────────────────────────────────────────────
   MAQSAD BELGILARI — ONB-GOALS-01.

   Foydalanuvchi oltita tayyor SVG yubordi va "yoki bizникiga moslashtir"
   dedi. Moslashtirildi: g'oyalari olindi (kalendar-nuqtalar, homiladorlik
   testi, qorin silueti), chizig'i esa shu to'plamning qoidalari bo'yicha
   qayta chizildi. Sababi — yuborilgan fayllar bir-biriga ham mos emas edi:
   uchta har xil fon doirasi (binafsha #E7D4EE, ko'k #D6E6F8, pushti
   #FBD3DD), tarozi butunlay ko'k, hayz kosasi yashil, homiladorlik esa
   anatomik chaqaloq. Ularni shundayligicha qo'yganda maqsad ro'yxati olti
   xil ilovadan yig'ilgandek ko'rinardi.
   ───────────────────────────────────────────────────────────────────────── */

/** Siklni kuzatish — kalendar va unda belgilangan kunlar. */
function GoalCycle() {
  return (
    <>
      <rect x="8" y="12" width="32" height="28" rx="5" {...S} />
      <path d="M8 21h32" {...S} />
      <path d="M17 8v7M31 8v7" {...S} />
      <circle cx="17" cy="29" r="2.4" fill="currentColor" opacity="0.85" />
      <circle cx="24" cy="29" r="2.4" fill="currentColor" opacity="0.55" />
      <circle cx="31" cy="29" r="2.4" fill="currentColor" opacity="0.3" />
      <circle cx="17" cy="35" r="2.4" fill="currentColor" opacity="0.2" />
    </>
  );
}

/** Homiladorman — homilador ayolning yon silueti.
 *
 * TO'PLAM QOIDASIDAN ATAYLAB CHEKINISH: bu belgi chiziqli emas,
 * TO'LDIRILGAN. Sababi sinovda aniqlandi — to'rtta variant 30px'da
 * yonma-yon chizilib solishtirildi:
 *   • yon profil (orqa chizig'i + qorin yoyi) → "þ" harfi;
 *   • doira ichidagi doira + quchoq yoyi → lupa yoki "Q";
 *   • yurak ichidagi chaqaloq → shunchaki yurak, homiladorlik emas.
 * Faqat to'ldirilgan siluet kichik o'lchamda ham bir qarashda o'qildi.
 * Chiziqli shakl bu yerda ishlamaydi, chunki tananing egri chizig'i
 * ingichka bo'lganda yopilib qoladi. */
function GoalPregnancy() {
  return (
    <g transform="translate(24 24) scale(1.2) translate(-24 -24)">
      <circle cx="20" cy="10" r="5" fill="currentColor" />
      <path
        d="M20 17c-4.6 0-7.6 3-7.6 7.6 0 3 .6 5.4.6 8.4 0 3-.6 5-.6 7h5c0-2 .4-4 .4-6.6 7-.6 12.2-5 12.2-10.2 0-4-3.4-6.2-10-6.2z"
        fill="currentColor"
      />
    </g>
  );
}

/** Homiladorlikni rejalashtiraman — kalendar va undagi yurak.
 *
 * Test tayoqchasi tashlandi: uning butun ma'nosi ikki INGICHKA chiziqda
 * edi va 26px'da ular yo'qolib, belgi plastirga o'xshab qolardi.
 * Kalendar esa `goal_cycle` bilan bitta oilada turadi va ikkalasi
 * ICHIDAGI belgi bilan farq qiladi — nuqtalar va yurak. Bu mantiqan ham
 * to'g'ri: rejalashtirish — bu ham kalendar, faqat boshqa maqsad bilan. */
function GoalPlanning() {
  return (
    <>
      <rect x="8" y="12" width="32" height="28" rx="5" {...S} />
      <path d="M8 21h32" {...S} />
      <path d="M17 8v7M31 8v7" {...S} />
      <path d="M24 35s-7.5-4.6-7.5-9.1a3.7 3.7 0 0 1 7.5-1.7 3.7 3.7 0 0 1 7.5 1.7c0 4.5-7.5 9.1-7.5 9.1z" fill="currentColor" opacity="0.38" />
    </>
  );
}

/** Umumiy salomatlik — barg va yumshoq yorqinlik. */
function GoalWellbeing() {
  return (
    <>
      <path d="M38 11c0 13.5-8.6 21.5-20.5 21.5-2 0-3.9-.3-5.5-.9C11 19.6 20.4 11 33 11h5z" {...S} />
      <path d="M11 39c2.6-6.4 7.4-11.4 13.5-14.6" {...S} />
      <circle cx="35" cy="34" r="2.2" fill="currentColor" opacity="0.35" />
    </>
  );
}

/** Tekshiruvlarni o'tkazib yubormayman — ro'yxat va belgi. */
function GoalCheckups() {
  return (
    <>
      <rect x="11" y="10" width="26" height="30" rx="5" {...S} />
      <path d="M20 8h8a2 2 0 0 1 2 2v3H18v-3a2 2 0 0 1 2-2z" fill="currentColor" opacity="0.3" />
      <path d="M18 26.5l4.2 4.2L31 21" {...S} />
    </>
  );
}

/** Tanamni tushunmoqchiman — lupa va uning ichida yurak. */
function GoalBody() {
  return (
    <>
      <circle cx="21" cy="21" r="12" {...S} />
      <path d="M30 30l8.5 8.5" {...S} />
      <path d="M21 27s-6-3.7-6-7.3A3 3 0 0 1 21 18.4a3 3 0 0 1 6 1.3c0 3.6-6 7.3-6 7.3z" fill="currentColor" opacity="0.32" />
    </>
  );
}

/** Teri — tomchi va yorqinlik. */
function GoalSkin() {
  return (
    <>
      <path d="M22 8c6.5 8.6 10.5 13.4 10.5 18.8A10.5 10.5 0 1 1 11.5 26.8C11.5 21.4 15.5 16.6 22 8z" {...S} />
      <path d="M17 28c0 3.4 2.6 6 6 6.4" {...S} opacity="0.5" />
      <path d="M37 9l1.2 3.4 3.4 1.2-3.4 1.2L37 18.2l-1.2-3.4-3.4-1.2 3.4-1.2L37 9z" fill="currentColor" opacity="0.4" />
    </>
  );
}

/** Hamkorimni kuzataman — ikki kishi va ular orasidagi yurak. */
function GoalPartner() {
  return (
    <>
      <circle cx="15" cy="20" r="5" {...S} />
      <path d="M6 40c0-5.5 4-9.5 9-9.5s9 4 9 9.5" {...S} />
      <circle cx="33" cy="22" r="4.4" {...S} opacity="0.6" />
      <path d="M25 40c0-4.8 3.6-8.2 8-8.2s8 3.4 8 8.2" {...S} opacity="0.6" />
      <path d="M24 15s-4.4-2.7-4.4-5.4A2.4 2.4 0 0 1 24 8.2a2.4 2.4 0 0 1 4.4 1.4c0 2.7-4.4 5.4-4.4 5.4z" fill="currentColor" opacity="0.4" />
    </>
  );
}

/** Perimenopauza — ufqdan ko'tarilayotgan quyosh: yangi bosqich,
 * "tugadi" emas. Bu ATAYLAB: bu davr ayol uchun yo'qotish sifatida
 * emas, o'tish sifatida ko'rsatilishi kerak. */
function GoalPerimenopause() {
  return (
    <>
      <path d="M8 34h32" {...S} />
      <path d="M24 15a10 10 0 0 1 10 10H14a10 10 0 0 1 10-10z" fill="currentColor" opacity="0.28" />
      <path d="M24 15a10 10 0 0 1 10 10H14a10 10 0 0 1 10-10z" {...S} />
      <path d="M24 7v3.5M37.5 14.5L35 17M10.5 14.5L13 17M41 25h3.5M3.5 25H7" {...S} opacity="0.5" />
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
  goal_cycle: GoalCycle,
  goal_pregnancy: GoalPregnancy,
  goal_planning: GoalPlanning,
  goal_wellbeing: GoalWellbeing,
  goal_checkups: GoalCheckups,
  goal_body: GoalBody,
  goal_skin: GoalSkin,
  goal_partner: GoalPartner,
  goal_perimenopause: GoalPerimenopause,
};

export function OnboardingIcon({ name, size = 52 }: { name: OnboardingIconName; size?: number }) {
  const Icon = ICONS[name];
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} role="presentation">
      <Icon />
    </svg>
  );
}
