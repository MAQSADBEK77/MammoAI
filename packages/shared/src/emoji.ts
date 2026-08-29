// Emoji ikonalar — https://fetch-blush-80931080.figma.site/ manba bundle'ida
// topilgan haqiqiy emoji to'plamiga mos ravishda tanlangan (kayfiyat, oqim,
// alomat, tsikl fazasi uchun). Foydalanuvchi so'rovi: "iconlarni qo'sh" —
// bu yerda IconChip/PhaseCard kabi joylarda ishlatiladigan bitta manba.

import type { Mood, FlowLevel, Symptom } from "./types";
import type { CyclePhase } from "./logic/cycle-phase";

export const MOOD_EMOJI: Record<Mood, string> = {
  happy: "😄",
  calm: "😌",
  tired: "😴",
  sad: "😔",
  irritable: "😡",
  anxious: "😰",
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
  bloating: "🎈",
  acne: "🔴",
  back_pain: "🦴",
  nausea: "🤢",
  breast_tenderness: "💗",
  insomnia: "😴",
  fatigue: "😪",
  irritability: "😤",
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
