/**
 * PREG-FOOD-01 — "Mumkinmi?" ro'yxati.
 *
 * Nega bu maqola emas, QIDIRUV: homilador ayolning savoli har doim bitta
 * mahsulot haqida va u DASTURXON USTIDA tug'iladi — "qurut yesam
 * bo'ladimi?", "bir piyola kofe-chi?". Uzun maqolani o'qishga na vaqt,
 * na kayfiyat bor. Shuning uchun bu yerda javob uch so'zda beriladi.
 *
 * Uchta javob bor, ikkitasi emas. "Mumkin emas" va "mumkin" orasidagi
 * MO'TADIL javob ("cheklang") eng ko'p ishlatiladigani: kofe, choy, tuz
 * butunlay taqiqlanmaydi, lekin miqdori muhim. Ikki holatga siqib
 * qo'yilsa, ro'yxat yolg'on gapirardi.
 *
 * Ro'yxat O'ZBEK dasturxoniga qarab tuzilgan — qurut, qatiq, qazi, non,
 * osh, somsa. Tarjima qilingan ilovalarda bu mahsulotlar yo'q, shuning
 * uchun ayol "menikida bunday narsa yo'q" degan xulosaga keladi.
 */

export type FoodVerdict = "safe" | "limit" | "avoid";
export type FoodGroup = "dairy" | "meat" | "drinks" | "produce" | "other";

export interface FoodItem {
  id: string;
  verdict: FoodVerdict;
  group: FoodGroup;
  /** Qidiruv uchun qo'shimcha yozilishlar (ruscha, so'zlashuv shakli). */
  aliases: string[];
}

export const PREGNANCY_FOODS: FoodItem[] = [
  // Sut mahsulotlari
  { id: "boiled_milk", verdict: "safe", group: "dairy", aliases: ["sut", "молоко"] },
  { id: "raw_milk", verdict: "avoid", group: "dairy", aliases: ["xom sut", "qaynatilmagan sut", "сырое молоко"] },
  { id: "qatiq", verdict: "safe", group: "dairy", aliases: ["yogurt", "ayron", "катык", "йогурт"] },
  { id: "suzma", verdict: "limit", group: "dairy", aliases: ["сузьма", "tvorog", "творог"] },
  { id: "qurut", verdict: "limit", group: "dairy", aliases: ["курт", "курут"] },
  { id: "hard_cheese", verdict: "safe", group: "dairy", aliases: ["pishloq", "сыр"] },
  { id: "soft_cheese", verdict: "avoid", group: "dairy", aliases: ["brinza", "suluguni", "брынза", "myagkiy sir"] },
  { id: "butter", verdict: "safe", group: "dairy", aliases: ["sariyog", "масло"] },
  { id: "ice_cream", verdict: "limit", group: "dairy", aliases: ["muzqaymoq", "мороженое"] },

  // Go'sht, baliq, tuxum
  { id: "cooked_meat", verdict: "safe", group: "meat", aliases: ["mol goshti", "qoy goshti", "мясо"] },
  { id: "raw_meat", verdict: "avoid", group: "meat", aliases: ["xom gosht", "chala pishgan", "сырое мясо", "steyk"] },
  { id: "chicken", verdict: "safe", group: "meat", aliases: ["tovuq", "курица"] },
  { id: "qazi", verdict: "avoid", group: "meat", aliases: ["казы", "kolbasa", "колбаса", "hasib"] },
  { id: "liver", verdict: "limit", group: "meat", aliases: ["jigar", "печень"] },
  { id: "cooked_fish", verdict: "safe", group: "meat", aliases: ["baliq", "losos", "рыба", "форель"] },
  { id: "raw_fish", verdict: "avoid", group: "meat", aliases: ["sushi", "суши", "xom baliq", "сырая рыба"] },
  { id: "high_mercury_fish", verdict: "avoid", group: "meat", aliases: ["orkinos", "tunets", "тунец", "akula"] },
  { id: "cooked_egg", verdict: "safe", group: "meat", aliases: ["tuxum", "яйцо"] },
  { id: "raw_egg", verdict: "avoid", group: "meat", aliases: ["xom tuxum", "uy mayonezi", "сырое яйцо", "krem"] },

  // Ichimliklar
  { id: "water", verdict: "safe", group: "drinks", aliases: ["suv", "вода"] },
  { id: "coffee", verdict: "limit", group: "drinks", aliases: ["qahva", "kofe", "кофе"] },
  { id: "black_tea", verdict: "limit", group: "drinks", aliases: ["qora choy", "чай"] },
  { id: "green_tea", verdict: "limit", group: "drinks", aliases: ["kok choy", "зеленый чай"] },
  { id: "herbal_tea", verdict: "limit", group: "drinks", aliases: ["giyoh choy", "travyanoy", "травяной чай"] },
  { id: "alcohol", verdict: "avoid", group: "drinks", aliases: ["aroq", "vino", "pivo", "алкоголь", "спиртное"] },
  { id: "energy_drink", verdict: "avoid", group: "drinks", aliases: ["energetik", "энергетик"] },
  { id: "soda", verdict: "limit", group: "drinks", aliases: ["gazli ichimlik", "cola", "кола", "газировка"] },
  { id: "fresh_juice", verdict: "safe", group: "drinks", aliases: ["sharbat", "fresh", "сок"] },

  // Meva-sabzavot
  { id: "washed_produce", verdict: "safe", group: "produce", aliases: ["meva", "sabzavot", "овощи", "фрукты"] },
  { id: "unwashed_produce", verdict: "avoid", group: "produce", aliases: ["yuvilmagan", "немытые"] },
  { id: "melon", verdict: "safe", group: "produce", aliases: ["qovun", "tarvuz", "дыня", "арбуз"] },
  { id: "pomegranate", verdict: "safe", group: "produce", aliases: ["anor", "гранат"] },
  { id: "grapes", verdict: "safe", group: "produce", aliases: ["uzum", "виноград"] },
  { id: "dried_fruit", verdict: "limit", group: "produce", aliases: ["quruq meva", "mayiz", "изюм", "kuraga"] },
  { id: "nuts", verdict: "safe", group: "produce", aliases: ["yongoq", "bodom", "орехи"] },
  { id: "sprouts", verdict: "avoid", group: "produce", aliases: ["mosh nihol", "rostki", "ростки"] },
  { id: "wild_mushroom", verdict: "avoid", group: "produce", aliases: ["qoziqorin", "грибы"] },

  // Boshqa
  { id: "bread", verdict: "safe", group: "other", aliases: ["non", "хлеб", "patir"] },
  { id: "osh", verdict: "safe", group: "other", aliases: ["palov", "плов"] },
  { id: "somsa", verdict: "safe", group: "other", aliases: ["самса", "manti", "манты"] },
  { id: "street_food", verdict: "avoid", group: "other", aliases: ["kocha ovqati", "фастфуд", "уличная еда"] },
  { id: "salt", verdict: "limit", group: "other", aliases: ["tuz", "соль"] },
  { id: "sugar", verdict: "limit", group: "other", aliases: ["shakar", "shirinlik", "сахар", "конфеты"] },
  { id: "honey", verdict: "safe", group: "other", aliases: ["asal", "мед"] },
  { id: "spicy", verdict: "safe", group: "other", aliases: ["achchiq", "qalampir", "острое"] },
  { id: "legumes", verdict: "safe", group: "other", aliases: ["mosh", "loviya", "nuxat", "фасоль"] },
  { id: "supplements", verdict: "limit", group: "other", aliases: ["vitamin", "bad", "добавки", "витамины"] },
];

/**
 * Qidiruv matnini solishtirishga tayyorlaydi.
 *
 * O'zbek lotin alifbosida bitta so'z bir necha xil yoziladi: "qo'ziqorin",
 * "qoʻziqorin", "qo`ziqorin", "qoziqorin". Foydalanuvchi telefon
 * klaviaturasida qaysi apostrofni bosishini bilib bo'lmaydi, shuning
 * uchun ularning HAMMASI olib tashlanadi. Aks holda ro'yxat "hech narsa
 * topilmadi" deb yolg'on gapirardi.
 */
export function normalizeFoodTerm(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ʻʼ‘’'`´]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Nomi yoki taxallusi so'rovga mos keladigan mahsulotlar.
 *
 * Tartib muhim: aniq mos kelgani birinchi, keyin BOSHLANISHI mos
 * kelgani, keyin ichida uchragani. "sut" yozilganda "sut" birinchi
 * turishi kerak, "xom sut" emas.
 */
export function searchPregnancyFoods(
  query: string,
  nameOf: (id: string) => string,
  items: FoodItem[] = PREGNANCY_FOODS
): FoodItem[] {
  const q = normalizeFoodTerm(query);
  if (!q) return items;

  const scored: { item: FoodItem; score: number }[] = [];
  for (const item of items) {
    const terms = [nameOf(item.id), ...item.aliases].map(normalizeFoodTerm);
    let best = 0;
    for (const term of terms) {
      if (term === q) best = Math.max(best, 3);
      else if (term.startsWith(q)) best = Math.max(best, 2);
      else if (term.includes(q)) best = Math.max(best, 1);
    }
    if (best > 0) scored.push({ item, score: best });
  }
  return scored
    .sort((a, b) => b.score - a.score || items.indexOf(a.item) - items.indexOf(b.item))
    .map((s) => s.item);
}

/** Bitta mahsulot — havola orqali ochilganda kerak. */
export function findPregnancyFood(id: string): FoodItem | null {
  return PREGNANCY_FOODS.find((f) => f.id === id) ?? null;
}
