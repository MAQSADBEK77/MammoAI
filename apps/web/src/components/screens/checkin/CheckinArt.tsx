/**
 * TODAY-02 — Check-in kartalari uchun illyustratsiyalar.
 *
 * Qo'lda yozilgan flat SVG sahnalar. Ataylab GEOMETRIK/soddalashtirilgan
 * uslubda (personajli, qo'lda chizilgan illyustratsiya emas) — kod bilan
 * chizilgan personaj professional illyustratordan sezilarli past chiqadi,
 * geometrik sahna esa shu usulda ham toza ko'rinadi.
 *
 * Har biri 200×140 viewBox'da va faqat IKKI rangdan foydalanadi:
 * - `ink`    — kartaning to'q ohangi (kontur/asosiy shakllar)
 * - oq/shaffof qatlamlar — `fill-white/..` orqali
 * Shu sababli istalgan kategoriya rangida to'g'ri ko'rinadi va keyinchalik
 * tayyor rasmga almashtirish oson (faqat shu fayl o'zgaradi).
 */

function Scene({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 140" role="presentation" className="h-full w-full">
      {/* Umumiy "yer" — barcha sahnalarni bir oilaga bog'lab turadi. */}
      <ellipse cx="100" cy="122" rx="74" ry="10" className="fill-white/15" />
      {children}
    </svg>
  );
}

/** Yengil harakat — gilamcha ustida cho'zilayotgan figura. */
function Movement() {
  return (
    <Scene>
      <rect x="34" y="96" width="132" height="14" rx="7" className="fill-white/35" />
      <circle cx="78" cy="56" r="15" className="fill-white" />
      <path d="M78 72c17 0 30 11 34 24H44c4-13 17-24 34-24z" className="fill-white/85" />
      <path d="M112 96c14-4 22-14 24-27" className="stroke-white/70" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="146" cy="60" r="8" className="fill-white/55" />
      <path d="M150 44v-8M158 52h8M142 52h-8M150 60v8" className="stroke-white/40" strokeWidth="4" strokeLinecap="round" />
    </Scene>
  );
}

/** Aloqada bo'lish — ikkita suhbat pufakchasi. */
function Friend() {
  return (
    <Scene>
      <path d="M36 34h74a12 12 0 0 1 12 12v30a12 12 0 0 1-12 12H62l-16 14V88h-10a12 12 0 0 1-12-12V46a12 12 0 0 1 12-12z" className="fill-white" />
      <circle cx="58" cy="61" r="5" className="fill-current opacity-60" />
      <circle cx="74" cy="61" r="5" className="fill-current opacity-60" />
      <circle cx="90" cy="61" r="5" className="fill-current opacity-60" />
      <path d="M128 54h38a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10h-6v12l-13-12h-19a10 10 0 0 1-10-10V64a10 10 0 0 1 10-10z" className="fill-white/55" />
    </Scene>
  );
}

/** Suv balansi — to'lgan stakan. */
function Water() {
  return (
    <Scene>
      <path d="M72 30h56l-7 76a10 10 0 0 1-10 9H89a10 10 0 0 1-10-9L72 30z" className="fill-white/30" />
      <path d="M77 62h46l-4 44a10 10 0 0 1-10 9H91a10 10 0 0 1-10-9l-4-44z" className="fill-white" />
      <rect x="68" y="24" width="64" height="10" rx="5" className="fill-white/60" />
      <path d="M150 52c6 7 9 12 9 17a9 9 0 1 1-18 0c0-5 3-10 9-17z" className="fill-white/60" />
    </Scene>
  );
}

/** Dam olish — oy, yulduzlar va yostiq. */
function Sleep() {
  return (
    <Scene>
      <path d="M118 22a36 36 0 1 0 34 47 28 28 0 0 1-34-47z" className="fill-white" />
      <circle cx="58" cy="34" r="4" className="fill-white/70" />
      <circle cx="44" cy="58" r="3" className="fill-white/50" />
      <circle cx="70" cy="60" r="2.5" className="fill-white/50" />
      <rect x="40" y="86" width="120" height="26" rx="13" className="fill-white/45" />
      <path d="M62 86c0-9 8-14 20-14s20 5 20 14" className="stroke-white/60" strokeWidth="6" strokeLinecap="round" fill="none" />
    </Scene>
  );
}

/** Toza havo — quyosh, tepaliklar va daraxt. */
function Outdoors() {
  return (
    <Scene>
      <circle cx="150" cy="40" r="18" className="fill-white" />
      <path d="M150 12v-8M150 76v-8M178 40h8M114 40h8M170 20l6-6M124 62l6-6M170 60l6 6M124 18l6 6" className="stroke-white/45" strokeWidth="4" strokeLinecap="round" />
      <path d="M14 110c22-32 40-44 56-44s34 12 56 44H14z" className="fill-white/40" />
      <rect x="66" y="78" width="8" height="32" rx="4" className="fill-white/75" />
      <circle cx="70" cy="66" r="22" className="fill-white" />
    </Scene>
  );
}

/** Kayfiyat kartasi uchun — yumshoq, mavhum "yurak urishi" sahnasi. */
function Mood() {
  return (
    <Scene>
      <circle cx="100" cy="64" r="40" className="fill-white/30" />
      <path
        d="M100 92s-26-16-26-34a15 15 0 0 1 26-10 15 15 0 0 1 26 10c0 18-26 34-26 34z"
        className="fill-white"
      />
      <path d="M40 64h20l8-12 10 24 8-12h6" className="stroke-white/60" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Scene>
  );
}

const ART: Record<string, () => React.ReactElement> = {
  movement: Movement,
  friend: Friend,
  water: Water,
  sleep: Sleep,
  outdoors: Outdoors,
  mood: Mood,
};

/** Berilgan savol kaliti uchun sahna. Kalit noma'lum bo'lsa — kayfiyat sahnasi
 * (yangi savol qo'shilib, rasmi hali chizilmagan holat uchun xavfsiz zaxira). */
export function CheckinArt({ questionKey }: { questionKey: string }) {
  const Component = ART[questionKey] ?? Mood;
  return <Component />;
}
