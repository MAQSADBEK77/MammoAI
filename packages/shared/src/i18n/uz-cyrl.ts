// O'zbek tili (Kirill yozuvi) — `uz.ts` (Lotin) dan `deepTransliterate` orqali
// avtomatik hosil qilinadi, shuning uchun ikkala yozuv har doim bir xil
// ma'noni bildiradi va alohida qo'lda tarjima qilib yurish shart emas.

import uz from "./uz";
import { deepTransliterate } from "./transliterate";
import type { Dictionary } from "./types";

const uzCyrl: Dictionary = deepTransliterate(uz);

export default uzCyrl;
