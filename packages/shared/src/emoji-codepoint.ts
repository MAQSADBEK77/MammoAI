// Emoji belgisini Twemoji fayl nomiga o'tkazadi — kichik harfli hex kod
// nuqtalari, "-" bilan ajratilgan, FE0F (variatsiya tanlagichi) olib tashlangan.
// Masalan: "❤️" -> "2764", "🇺🇿" -> "1f1fa-1f1ff". Bir xil funksiya HAM yuklab
// olingan fayl nomlarini, HAM ilova ichidagi qidiruvni belgilaydi — shu tufayli
// ikkalasi doim mos keladi.
export function emojiToTwemojiCode(emoji: string): string {
  return Array.from(emoji)
    .map((ch) => ch.codePointAt(0)!)
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16))
    .join("-");
}
