import uz from "./uz";
import uzCyrl from "./uz-cyrl";
import ru from "./ru";
import en from "./en";
import type { Dictionary } from "./types";
import type { Language } from "../types";

export const dictionaries: Record<Language, Dictionary> = { uz, "uz-cyrl": uzCyrl, ru, en };
export type { Dictionary };
export { uz, ru, en, uzCyrl };
export { latinToCyrillicUz } from "./transliterate";
