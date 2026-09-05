import { createElement } from "react";
import { Text } from "react-native";
import { emojiToTwemojiCode } from "@mammoai/shared";
import { EMOJI_COMPONENTS } from "@/lib/emoji-components";

/**
 * Tizim shrifti o'rniga bitta izchil (Twemoji) uslubdagi rasm — Android, iOS
 * va turli qurilmalarda bir xil ko'rinishi uchun (foydalanuvchi so'roviga
 * ko'ra: "hamma qurilmada bir xil chiqadigan qilish kerak"). `e` — asl emoji
 * belgisi (masalan "😄"). Kutubxonada topilmasa (bo'lmasligi kerak), asl
 * belgi tizim shrifti bilan ko'rsatiladi — sukut emas.
 */
export function Emoji({ e, size = 20 }: { e: string; size?: number }) {
  const Component = EMOJI_COMPONENTS[emojiToTwemojiCode(e)];
  if (!Component) return <Text style={{ fontSize: size * 0.85 }}>{e}</Text>;
  return createElement(Component, { width: size, height: size });
}
