// SVG'ni React komponenti sifatida import qilish uchun pipeline tayyor (metro.config.js
// + react-native-svg-transformer). DIQQAT: joriy logo.svg ichida <style>/CSS-klass va
// maxsus shrift (Baloo) matn sifatida ishlatilgan — react-native-svg buni to'liq
// qo'llab-quvvatlamasligi mumkin. Sinovdan o'tguncha onboarding'da emoji-belgi
// ishlatilmoqda (src/app/onboarding.tsx) — bu yerda tayyor, lekin ehtiyot bilan sinab
// ko'ring (yoki logo.svg'ni matnisiz/path'ga aylantirilgan holatga soddalashtiring).
import LogoSvg from "../../assets/images/logo.svg";

export function Logo({ width = 220, height = 124 }: { width?: number; height?: number }) {
  return <LogoSvg width={width} height={height} />;
}
