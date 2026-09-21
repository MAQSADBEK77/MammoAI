// LOKAL DEV UCHUN — brauzerda ilovani ko'rish uchun bitta TEST akkaunti.
// Idempotent: qayta ishga tushirilsa yangi akkaunt yaratmaydi, mavjudini topadi.
// Hech qanday real foydalanuvchi ma'lumotiga tegmaydi.
//
// Ishlatish (apps/web ichidan):
//   node --env-file=.env.local --import tsx scripts/dev-test-user.ts

import type { OnboardingProfile } from "@mammoai/shared";
import { sql } from "../src/server/db";
import {
  createUserWithIdentifier,
  findUserByIdentifier,
  getOnboardingProfile,
  saveOnboardingProfile,
  updateUser,
} from "../src/server/repo";
import { syncChecklistForUser } from "../src/server/checklist-sync";
import { SESSION_COOKIE, signSession } from "../src/server/session";

// +998 000 ... — O'zbekistonda bunday mobil prefiks yo'q, shuning uchun
// hech qachon haqiqiy foydalanuvchi raqami bilan to'qnashmaydi.
const TEST_PHONE = "+998000000000";
const TEST_NAME = "TEST akkaunt (dev)";

// Bu skript `.ts` sifatida CJS'ga o'giriladi (apps/web'da `"type": "module"`
// yo'q) — shuning uchun top-level `await` ishlamaydi, repodagi boshqa
// skriptlar (scripts/seed.ts) kabi async funksiyaga o'raladi.
async function main() {
  const existing = await findUserByIdentifier(TEST_PHONE);
  const { user, tokenVersion } = existing
    ? { user: existing, tokenVersion: existing.tokenVersion }
    : await createUserWithIdentifier(TEST_PHONE, "uz");

  if (!existing) {
    await updateUser(user.id, { name: TEST_NAME, notificationsEnabled: false });
  }

  // `is_test_account` — admin ro'yxati va BARCHA statistika shu bayroq
  // bo'yicha filtrlanadi (repo.ts: "WHERE is_test_account = FALSE"), ya'ni
  // bu akkaunt hisobotlarni buzmaydi. Har safar o'rnatiladi, chunki akkaunt
  // bayroq qo'shilishidan oldin yaratilgan bo'lishi mumkin.
  await sql`UPDATE users SET is_test_account = TRUE WHERE id = ${user.id}`;

  // Mavzu — YORUG'. Standart qiymat "system" bo'lgani uchun ilova telefon
  // sozlamasiga ergashadi; dizayn ustida ishlaganda esa mavzu telefonga qarab
  // o'zgarib turishi xalaqit beradi. "light" qo'yilganda tizim afzalligi
  // butunlay e'tiborga olinmaydi (lib/session.tsx: `preference !== "system"`
  // bo'lsa matchMedia tinglanmaydi). Har ishga tushirishda qayta o'rnatiladi.
  await sql`UPDATE users SET theme = 'light' WHERE id = ${user.id}`;

  if (!(await getOnboardingProfile(user.id))) {
    const profile: OnboardingProfile = {
      userId: user.id,
      name: TEST_NAME,
      age: 28,
      isPregnant: false,
      cycleRegularity: "regular",
      familyHistory: false,
      sexuallyActive: false,
      lastCheckup: "unknown",
      primaryGoal: "cycle",
      heardAboutUs: null,
      typicalSymptoms: [],
      periodAttitude: null,
      healthConditions: [],
      healthConditionsOther: null,
      heightCm: 165,
      weightKg: 60,
      bloodType: null,
    };
    await saveOnboardingProfile(profile);
    await syncChecklistForUser(user.id, profile);
  }

  const token = signSession({ sub: user.id, tokenVersion });

  console.log(existing ? "\nMavjud TEST akkaunt topildi." : "\nYangi TEST akkaunt yaratildi.");
  console.log("  user id :", user.id);
  console.log("  telefon :", TEST_PHONE);
  console.log("  mavzu   : light (yorug')");
  console.log("\nBrauzerda localhost:3000 ochib, DevTools -> Console'ga shuni qo'ying:\n");
  console.log(`document.cookie = "${SESSION_COOKIE}=${token}; path=/; max-age=31536000"`);
  console.log();

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
