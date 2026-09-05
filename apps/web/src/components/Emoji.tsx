import { emojiToTwemojiCode } from "@mammoai/shared";

/**
 * Tizim shrifti o'rniga bitta izchil (Twemoji) uslubdagi rasm — Android, iOS,
 * Windows va turli brauzerlarda bir xil ko'rinishi uchun (foydalanuvchi
 * so'roviga ko'ra: "hamma qurilmada bir xil chiqadigan qilish kerak").
 * `e` — asl emoji belgisi (masalan "😄") — `alt` sifatida ham xizmat qiladi.
 */
export function Emoji({ e, size = 20, className }: { e: string; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- statik emoji SVG, next/image optimizatsiyasi kerak emas
    <img
      src={`/emoji/${emojiToTwemojiCode(e)}.svg`}
      alt={e}
      className={className}
      style={{ width: size, height: size, display: "inline-block", verticalAlign: "-0.15em", flexShrink: 0 }}
    />
  );
}
