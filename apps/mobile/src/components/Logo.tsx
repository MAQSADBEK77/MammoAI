// SVG'ni React komponenti sifatida import qilish (metro.config.js + react-native-svg-transformer).
// logo.svg endi faqat shaffof fonli "m." belgisi (matn/orqa fonsiz, bitta fill-klass) —
// WelcomeHero'da onboarding "welcome" qadamida ishlatiladi.
import LogoSvg from "../../assets/images/logo.svg";

export function Logo({ width = 220, height = 124 }: { width?: number; height?: number }) {
  return <LogoSvg width={width} height={height} />;
}
