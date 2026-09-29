// SIZE-IMG-01 — haftalik "meva" rasmlari.
//
// Nega kerak: ekranda "Bolangiz hozir qovun kattaligida" deb yoziladi va
// yonida EMOJI turadi. Emoji to'plami esa atigi 10 ta mevani qoplaydi —
// "moshdona", "romaine salat", "pichan" kabi nomlarga mos belgi yo'q va
// ular uchun umumiy limon ikonkasi chiqadi. Foydalanuvchi so'rovi:
// har bir hafta uchun o'z rasmi bo'lsin.
//
// Uslub BARCHA rasmlar uchun bitta shablondan chiqadi — aks holda 42 ta
// rasm 42 xil ko'rinadi va ekran yamoqqa aylanadi.
//
// Ishga tushirish:
//   node --env-file=.env.local --import tsx scripts/generate-size-images.ts            (nima yozilishini ko'rsatadi)
//   node --env-file=.env.local --import tsx scripts/generate-size-images.ts --write    (generatsiya qiladi)
//   ... --write --week=8            (faqat bitta hafta)
//   ... --write --model=gemini-3-pro-image
//
// MUHIM: kalit BEPUL tarifda bo'lsa rasm modellari 429 qaytaradi
// (2026-09-29 da tekshirildi: uchala image modelida ham kvota tugagan).
// Bu holda Google Cloud loyihasida billing yoqilishi kerak.

import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ensureSchema, sql } from "../src/server/db";
import { getGeminiApiKey } from "../src/server/ai-chat";

const WRITE = process.argv.includes("--write");
const MODEL = process.argv.find((a) => a.startsWith("--model="))?.slice(8) ?? "gemini-3.1-flash-image";
const ONLY_WEEK = Number(process.argv.find((a) => a.startsWith("--week="))?.slice(7) ?? "0") || null;
const OUT_DIR = join(process.cwd(), "public", "size");

/** Kutish: bepul tarifda daqiqalik kvota bor, ketma-ket so'rov 429 beradi. */
const DELAY_MS = 20_000;

/**
 * Bazadagi o'zbekcha nomni rasm uchun ingliz tilidagi ANIQ predmetga
 * o'giradi. Bevosita tarjima yetarli emas: "moshdona" — mung bean,
 * "pichan (leek)" — praz piyoz, "no'xat donasi" — bitta no'xat.
 * Noto'g'ri tarjima butun rasmni buzadi, shuning uchun qo'lda.
 */
const OBJECTS: Record<string, string> = {
  "hali otalanmagan": "a single tiny poppy seed",
  "moshdona urug'i": "a single mung bean seed",
  "qum zarrachasi": "a single grain of sand on a fingertip-free surface",
  moshdona: "a single mung bean",
  "kunjut urug'i": "a single sesame seed",
  "no'xat donasi": "a single green pea",
  "ko'k moviz": "a single fresh blueberry",
  malina: "a single ripe raspberry",
  uzum: "a small bunch of green grapes",
  kivi: "a whole kiwi fruit",
  anjir: "a single fresh fig",
  anor: "a single pomegranate",
  limon: "a single lemon",
  shaftoli: "a single ripe peach",
  apelsin: "a single orange",
  olma: "a single red apple",
  avokado: "a single avocado",
  nok: "a single pear",
  "bolgar qalampiri": "a single red bell pepper",
  pomidor: "a single ripe tomato",
  banan: "a single banana",
  sabzi: "a single carrot",
  bodring: "a single cucumber",
  baqlajon: "a single eggplant",
  "makkajo'xori": "a single ear of corn with husk",
  "gulkaram boshi": "a head of cauliflower",
  "karam boshi": "a head of green cabbage",
  "gul karam": "a head of romanesco cauliflower",
  "katta baqlajon": "a large eggplant",
  "kichik qovoq": "a small pumpkin",
  "katta karam": "a large head of cabbage",
  "kokos yong'og'i": "a whole coconut",
  ananas: "a whole pineapple",
  "katta ananas": "a large whole pineapple",
  qovun: "a honeydew melon",
  "katta qovun": "a large honeydew melon",
  "romaine salat": "a head of romaine lettuce",
  "pichan (leek)": "a single leek",
  "kichik qovun": "a small melon",
  "kichik tarvuz": "a small watermelon",
  tarvuz: "a whole watermelon",
  "katta tarvuz": "a large whole watermelon",
};

/** Barcha rasmlar uchun BITTA uslub. */
function prompt(object: string): string {
  return (
    `Soft, clean 3D-rendered illustration of ${object}, centered, photoreal but gently stylized, ` +
    `warm natural colors, plain soft cream-peach background (#fdf5f0), soft diffused studio light, ` +
    `subtle contact shadow underneath, no text, no hands, no people, no extra props, square 1:1 composition, ` +
    `the object fills about 70% of the frame, calm and friendly mood for a women's health app`
  );
}

async function generate(apiKey: string, object: string): Promise<Buffer | null> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt(object) }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[];
    error?: { code?: number; message?: string };
  };
  if (json.error) {
    console.error(`  xato ${json.error.code}: ${json.error.message?.slice(0, 120)}`);
    return null;
  }
  const data = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
  return data ? Buffer.from(data, "base64") : null;
}

async function main() {
  await ensureSchema();
  const rows = (await sql`SELECT week, size_label FROM pregnancy_week_content ORDER BY week`) as unknown as {
    week: number;
    size_label: string;
  }[];

  const jobs = rows
    .filter((r) => (ONLY_WEEK ? r.week === ONLY_WEEK : true))
    .map((r) => ({ week: r.week, label: r.size_label, object: OBJECTS[r.size_label] }));

  const unknown = jobs.filter((j) => !j.object);
  if (unknown.length > 0) {
    console.error("Tarjimasi yo'q nomlar (OBJECTS ga qo'shing):", unknown.map((u) => u.label).join(", "));
    process.exit(1);
  }

  if (!WRITE) {
    for (const j of jobs) console.log(`${j.week}-hafta  ${j.label}  ->  ${j.object}`);
    console.log(`\n${jobs.length} ta rasm tayyorlanadi. Generatsiya uchun: -- --write`);
    process.exit(0);
  }

  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    console.error("Gemini kaliti sozlanmagan (admin panel -> AI).");
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  let made = 0;
  for (const j of jobs) {
    const file = join(OUT_DIR, `week${j.week}.png`);
    if (existsSync(file)) {
      console.log(`${j.week}-hafta: bor, o'tkazib yuborildi`);
      continue;
    }
    process.stdout.write(`${j.week}-hafta (${j.label})... `);
    const buf = await generate(apiKey, j.object!);
    if (buf) {
      writeFileSync(file, buf);
      made++;
      console.log(`${Math.round(buf.length / 1024)} KB`);
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  console.log(`\n${made} ta rasm yaratildi.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Xatolik:", error);
  process.exit(1);
});
