// MONETIZE-01: AI Yordamchiga kirish huquqi — bepul tanishtiruv + Premium.
//
// Nima uchun: ilgari yordamchi TO'LIQ yopiq edi — birinchi xabardanoq 402
// qaytarardi. Production o'lchovi: 68 ayol yordamchini ochgan, atigi 5 tasi
// biror xabar yozolgan. Ya'ni 63 ayol hech qachon ko'rmagan narsaga pul
// so'ralgan. Odam sinab ko'rmagan mahsulotga pul to'lamaydi, shuning uchun
// avval bir necha bepul xabar beriladi — paywall esa ayol yordamchining
// qandayligini BILGANIDAN keyin chiqadi.
//
// Bepul xabarlar UMRBOD (har kuni yangilanmaydi) — aks holda bu Premiumning
// o'rnini bosuvchi bepul tarifga aylanib qolardi.

import { countUserChatMessages, hasPremiumAccess } from "./repo";

export const FREE_MESSAGE_ALLOWANCE = 5;

export interface ChatAccess {
  hasPremium: boolean;
  /** Premium bo'lmagan foydalanuvchida qolgan bepul xabarlar soni. */
  freeMessagesLeft: number;
  /** Hozir xabar yubora oladimi (Premium YOKI bepul xabari bor). */
  canSend: boolean;
  /** Bepul xabarlarning umumiy soni — mijoz "3/5" ko'rinishida chizadi. */
  freeAllowance: number;
}

export async function getChatAccess(userId: string): Promise<ChatAccess> {
  const [hasPremium, used] = await Promise.all([hasPremiumAccess(userId), countUserChatMessages(userId)]);
  const freeMessagesLeft = Math.max(FREE_MESSAGE_ALLOWANCE - used, 0);
  return {
    hasPremium,
    freeMessagesLeft,
    canSend: hasPremium || freeMessagesLeft > 0,
    freeAllowance: FREE_MESSAGE_ALLOWANCE,
  };
}
