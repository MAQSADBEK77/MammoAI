import uz from "./uz";
import uzCyrl from "./uz-cyrl";
import ru from "./ru";
import en from "./en";
import type { Dictionary } from "./types";
import type { Language } from "../types";
import { ApiError } from "../api-client";

export const dictionaries: Record<Language, Dictionary> = { uz, "uz-cyrl": uzCyrl, ru, en };
export type { Dictionary };
export { uz, ru, en, uzCyrl };
export { latinToCyrillicUz } from "./transliterate";

/**
 * FIX2-20: server validatsiya/limit xatolarini o'zbekcha xom matn o'rniga
 * joriy tilga tarjima qilib ko'rsatish uchun. `error.key` mavjud va
 * `dict.apiErrors`da tan olingan bo'lsa — o'sha tarjima qaytariladi;
 * aks holda (hali `key` yubormaydigan eski endpoint, yoki tarmoq xatosi)
 * `error.message`ga (yoki umumiy xatolik matniga) tushiladi.
 */
export function translateApiError(error: unknown, dict: Dictionary): string {
  if (error instanceof ApiError) {
    if (error.key && error.key in dict.apiErrors) {
      return dict.apiErrors[error.key as keyof typeof dict.apiErrors];
    }
    return error.message;
  }
  return error instanceof Error ? error.message : dict.common.errorGeneric;
}
