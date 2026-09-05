// Emoji ikonalar — https://fetch-blush-80931080.figma.site/ manbasining asl
// React kodi (loyiha ichiga "Uzbek Women's Health Tracker" nomi bilan tashlangan
// figma-make eksporti, src/App.tsx) dan olingan ANIQ emoji to'plami (kayfiyat,
// alomat, tsikl fazasi va h.k. uchun) — endi taxmin emas, aynan manbadan.
// Foydalanuvchi so'rovi: "shundagi iconlarni meni dasturimga qil".

import type { Mood, FlowLevel, Symptom } from "./types";
import type { CyclePhase } from "./logic/cycle-phase";

export const MOOD_EMOJI: Record<Mood, string> = {
  happy: "😄",
  calm: "🙂",
  tired: "😴",
  sad: "😔",
  irritable: "😡",
  anxious: "😰",
};

// Kayfiyat sharhi matni oxiridagi emoji (i18n moodResponses.*) — MOOD_EMOJI'dan
// mustaqil, chunki matn ohangiga mos boshqa emoji tanlangan (masalan "sad" uchun
// tanlagichdagi 😔 emas, g'amxo'rlik ma'nosidagi 💗).
export const MOOD_RESPONSE_EMOJI: Record<Mood, string> = {
  happy: "😄",
  calm: "🙂",
  tired: "😴",
  sad: "💗",
  irritable: "🌿",
  anxious: "💕",
};

export const FLOW_EMOJI: Record<FlowLevel, string> = {
  spotting: "💧",
  light: "🌸",
  medium: "🩸",
  heavy: "🌊",
};

export const SYMPTOM_EMOJI: Record<Symptom, string> = {
  cramps: "🤕",
  headache: "🤯",
  bloating: "🫀",
  acne: "🔴",
  back_pain: "🦴",
  nausea: "🤢",
  breast_tenderness: "💗",
  insomnia: "😴",
  fatigue: "😴",
  irritability: "🌊",
  difficulty_concentrating: "🌀",
};

export const CYCLE_PHASE_EMOJI: Record<CyclePhase, string> = {
  menstrual: "🩸",
  follicular: "🌱",
  ovulation: "🥚",
  luteal: "🌙",
};

/**
 * Diagonal gradient uchun ikkita rang qaytaradi (bazaviy rang → shu rangning
 * xiraroq/quyuqroq varianti) — manba kodida topilgan
 * `linear-gradient(135deg, ${color} 0%, ${color}BB 100%)` naqshiga asoslangan.
 * Web CSS string yig'ish uchun, mobil esa LinearGradient'ning `colors` prop'i
 * uchun to'g'ridan-to'g'ri ishlatadi.
 */
export function gradientStops(hex: string): [string, string] {
  return [hex, `${hex}BB`];
}

export function cssGradient(hex: string, angle = 135): string {
  const [from, to] = gradientStops(hex);
  return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
}
