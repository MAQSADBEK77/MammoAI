// LOGO-01 — brend belgisi, RANGNI MEROS QILIB OLADIGAN variant.
//
// Muammo: `public/logo.svg` ichida rang qattiq yozilgan — `fill:#FFFAF1`,
// ya'ni deyarli OQ. U qorong'u fon uchun chizilgan (landing hero), lekin
// onboarding kirish ekranining foni OCH. Natijada belgi oq fonda oq bo'lib,
// shaklsiz xira dog' ko'rinishida turardi — foydalanuvchi buni "juda hunik"
// deb aytdi.
//
// `next/image` orqali yuklangan SVG rangni meros qila olmaydi (u oddiy
// rasm sifatida chiziladi). Shuning uchun belgi shu yerda INLINE, va rangi
// `currentColor` — endi u turgan joyining matn rangini oladi:
//   och fonda  → `text-primary` (brend pushtisi)
//   to'q fonda → `text-white`
//
// `public/logo.svg` o'z joyida qoladi: u favicon/OG rasm kabi haqiqiy
// FAYL kerak bo'lgan joylarda ishlatiladi.
/**
 * LOGO-02 — brendning TO'LIQ belgisi: pushti doira ichida krem rangli "m".
 *
 * `logo.svg`dagi rang (#FFFAF1) tasodifiy emas — belgi AYNAN pushti fon
 * ustida turishi uchun chizilgan, ilovaning o'z ikonkasi ham (icon-512.png)
 * shunday: pushti kvadrat + krem "m".
 *
 * Ilgari kirish ekranida faqat belgining o'zi, fonsiz chizilardi — oq fonda
 * oq bo'lib ko'rinmasdi. Uni shunchaki pushtiga bo'yash ham to'g'ri emas:
 * u holda brend o'z ikonkasidan boshqacha ko'rinadi. To'g'ri yechim —
 * ikonkadagi kabi to'liq belgi.
 */
export function LogoBadge({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "9999px",
        background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
      }}
    >
      {/* Krem rang — ikonkadagi bilan bir xil (#FFFAF1). */}
      <LogoMark className="h-[46%] w-[62%]" style={{ color: "#FFFAF1" }} />
    </span>
  );
}

export function LogoMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="606 342 708 396" role="img" aria-hidden="true" className={className} style={style} fill="currentColor">
      <path d="M648.57,614.61c-3.06-16.14-3.59-36.22-0.16-61.19c0.07-0.5,0.12-1,0.17-1.51
	c1.21-13.14,28.7-231.25,228.01-114.3c11.19,6.57,25.19,6.04,35.79-1.44c43.86-30.96,163.49-91.38,228.61,96.53
	c1.59,0.12,17.37,100.82,89.25,77.16c21.51-7.08,43.7,8.64,43.7,31.29v0c0,15.2-10.36,28.43-25.11,32.09
	c-46.98,11.64-146.06,15.92-175.39-141.64c-0.52-2.82-1.38-5.56-2.6-8.15c-7.76-16.56-40.83-80.09-105.01-48.04
	c-3.09,1.54-5.92,3.55-8.39,5.96c-7.95,7.78-31.44,31.94-29.91,78.62c0.71,21.54,0.88,44.01,0.82,63.65
	c-0.11,37.21-52.51,46-64.29,10.7c-0.73-2.19-1.4-4.49-1.98-6.9c-0.73-2.99-0.96-6.06-0.8-9.13
	c3.02-57.81,11.14-159.99-83.77-150.83c-2.8,0.27-5.56,0.9-8.21,1.84c-10.45,3.72-60.73,16.66-55.3,107.51
	c0.04,0.63,0.06,1.26,0.06,1.89v29.59C714.08,648.36,656.02,653.95,648.57,614.61z" />
    </svg>
  );
}
