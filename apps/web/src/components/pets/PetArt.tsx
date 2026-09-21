import type { Pet } from "@mammoai/shared";

/**
 * PET-01 — bosh ekrandagi uy hayvonlari (faqat 18 yoshgacha bo'lgan
 * foydalanuvchilar uchun, foydalanuvchi so'rovi).
 *
 * Qo'lda yozilgan flat SVG. Uslub ATAYLAB sodda va yumaloq: kod bilan
 * chizilgan "realistik" personaj yomon chiqadi, yumaloq shakllardan yig'ilgan
 * sodda personaj esa toza ko'rinadi. Hammasi bitta 120×120 viewBox'da va bir
 * xil "og'irlik"da — yonma-yon qo'yilganda bitta oilaga o'xshashi uchun.
 *
 * Ranglar qattiq yozilgan (brend tokeni emas) — bu personaj ranglari, rejim
 * rangi bilan o'zgarmasligi kerak.
 */

function Face({ cx, cy, eyeDx = 9, blush }: { cx: number; cy: number; eyeDx?: number; blush?: string }) {
  return (
    <>
      <circle cx={cx - eyeDx} cy={cy} r="4.2" fill="#2B2436" />
      <circle cx={cx + eyeDx} cy={cy} r="4.2" fill="#2B2436" />
      {/* Ko'zdagi yorug'lik nuqtasi — "tirik" ko'rinish beradigan eng arzon detal. */}
      <circle cx={cx - eyeDx + 1.5} cy={cy - 1.5} r="1.4" fill="#FFFFFF" />
      <circle cx={cx + eyeDx + 1.5} cy={cy - 1.5} r="1.4" fill="#FFFFFF" />
      <path
        d={`M${cx - 4} ${cy + 8} q4 4 8 0`}
        stroke="#2B2436"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {blush && (
        <>
          <ellipse cx={cx - eyeDx - 7} cy={cy + 6} rx="4.5" ry="3" fill={blush} opacity="0.55" />
          <ellipse cx={cx + eyeDx + 7} cy={cy + 6} rx="4.5" ry="3" fill={blush} opacity="0.55" />
        </>
      )}
    </>
  );
}

function Cat() {
  return (
    <>
      <ellipse cx="60" cy="98" rx="30" ry="7" fill="#000" opacity="0.07" />
      <path d="M36 44l-4-18 18 9z" fill="#4A4258" />
      <path d="M84 44l4-18-18 9z" fill="#4A4258" />
      <path d="M39 42l-2-10 10 5z" fill="#F2A7BE" />
      <path d="M81 42l2-10-10 5z" fill="#F2A7BE" />
      <ellipse cx="60" cy="86" rx="24" ry="16" fill="#4A4258" />
      <path d="M84 84c10 2 14 8 12 14" stroke="#4A4258" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="56" r="26" fill="#554C63" />
      <Face cx={60} cy={54} blush="#F2A7BE" />
      <path d="M52 64h16" stroke="#2B2436" strokeWidth="0" />
    </>
  );
}

function Puppy() {
  return (
    <>
      <ellipse cx="60" cy="98" rx="30" ry="7" fill="#000" opacity="0.07" />
      <ellipse cx="60" cy="86" rx="23" ry="15" fill="#C89A6B" />
      <ellipse cx="36" cy="58" rx="9" ry="16" fill="#9C7047" />
      <ellipse cx="84" cy="58" rx="9" ry="16" fill="#9C7047" />
      <circle cx="60" cy="56" r="25" fill="#D8AC7D" />
      <ellipse cx="60" cy="68" rx="11" ry="8" fill="#F0DAC2" />
      <ellipse cx="60" cy="63" rx="4" ry="3" fill="#2B2436" />
      <Face cx={60} cy={50} eyeDx={8} blush="#E88BA4" />
    </>
  );
}

function Bunny() {
  return (
    <>
      <ellipse cx="60" cy="98" rx="28" ry="7" fill="#000" opacity="0.07" />
      <ellipse cx="48" cy="28" rx="7" ry="20" fill="#F3EAF2" />
      <ellipse cx="72" cy="28" rx="7" ry="20" fill="#F3EAF2" />
      <ellipse cx="48" cy="29" rx="3.5" ry="14" fill="#F2A7BE" />
      <ellipse cx="72" cy="29" rx="3.5" ry="14" fill="#F2A7BE" />
      <ellipse cx="60" cy="86" rx="22" ry="15" fill="#F3EAF2" />
      <circle cx="60" cy="60" r="24" fill="#FAF4FA" />
      <Face cx={60} cy={56} eyeDx={8} blush="#F2A7BE" />
      <circle cx="60" cy="64" r="2.6" fill="#E88BA4" />
    </>
  );
}

function Chick() {
  return (
    <>
      <ellipse cx="60" cy="98" rx="26" ry="7" fill="#000" opacity="0.07" />
      <path d="M52 96l-6 6M68 96l6 6" stroke="#E8912F" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="60" cy="72" rx="28" ry="26" fill="#FFD966" />
      <ellipse cx="34" cy="72" rx="8" ry="13" fill="#F5C93F" />
      <ellipse cx="86" cy="72" rx="8" ry="13" fill="#F5C93F" />
      <path d="M56 40q4-10 8 0" stroke="#F5C93F" strokeWidth="4" strokeLinecap="round" fill="none" />
      <Face cx={60} cy={64} eyeDx={8} blush="#F2A7BE" />
      <path d="M56 76l4 5 4-5z" fill="#E8912F" />
    </>
  );
}

function Panda() {
  return (
    <>
      <ellipse cx="60" cy="98" rx="30" ry="7" fill="#000" opacity="0.07" />
      <circle cx="38" cy="38" r="10" fill="#3A3442" />
      <circle cx="82" cy="38" r="10" fill="#3A3442" />
      <ellipse cx="60" cy="84" rx="25" ry="17" fill="#F7F5F8" />
      <ellipse cx="38" cy="84" rx="8" ry="11" fill="#3A3442" />
      <ellipse cx="82" cy="84" rx="8" ry="11" fill="#3A3442" />
      <circle cx="60" cy="54" r="26" fill="#FAF9FB" />
      <ellipse cx="49" cy="52" rx="8.5" ry="10" fill="#3A3442" transform="rotate(-15 49 52)" />
      <ellipse cx="71" cy="52" rx="8.5" ry="10" fill="#3A3442" transform="rotate(15 71 52)" />
      <circle cx="49" cy="52" r="3.4" fill="#FFFFFF" />
      <circle cx="71" cy="52" r="3.4" fill="#FFFFFF" />
      <ellipse cx="60" cy="64" rx="4" ry="3" fill="#3A3442" />
      <path d="M56 70q4 4 8 0" stroke="#3A3442" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </>
  );
}

const PETS: Record<Pet, () => React.ReactElement> = {
  cat: Cat,
  puppy: Puppy,
  bunny: Bunny,
  chick: Chick,
  panda: Panda,
};

export function PetArt({ pet, size = 96, className }: { pet: Pet; size?: number; className?: string }) {
  const Component = PETS[pet];
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="presentation" className={className}>
      <Component />
    </svg>
  );
}
