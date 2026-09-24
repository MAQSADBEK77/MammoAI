// QA-001 — sikl API'si uchun integratsiya testlari (faqat sof funksiyalar emas).
// packages/shared'dagi 114 ta unit test cycle.ts'ning MATEMATIKASINI to'liq
// qamraydi, lekin CYCLE-001 aynan bu qatlamda — repo.ts'ning bazaga YOZISH
// mantig'ida — yashiringan edi, u yerda hech qanday avtomatik test yo'q edi.
// Bu skript ALOHIDA, bir martalik bazaga qarshi emas — CI'da har push'da
// GitHub Actions'ning vaqtinchalik `postgres:16` xizmat konteynerига qarshi
// ishga tushadi (.github/workflows/ci.yml), shuning uchun productionga
// HECH QANDAY ta'sir qilmaydi va real foydalanuvchi ma'lumotlariga tegmaydi.
//
// Ishga tushirish: DATABASE_URL=... node --import tsx scripts/integration-test.ts

import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "../src/server/db";
import { ApiError } from "../src/server/api-utils";
import { getCycleSettings, upsertCycleLog, deleteCycleLog, listCycleLogs, updateCycleSettings } from "../src/server/repo";
import { countCycleLogs, getMaxCycleLogUpdatedAt } from "../src/server/repo";
import { getPregnancyWeekContent, upsertPregnancyWeekContent } from "../src/server/repo";
import {
  createCommunityPost,
  createCommunityReport,
  blockCommunityPostAuthor,
  listCommunityPosts,
  listOpenCommunityReports,
  resolveCommunityReport,
  unblockUser,
  createAdminUser,
  findAdminUserByEmail,
  deleteAdminUser,
  adminUserExistsById,
  logAdminAction,
  listAdminAuditLog,
  connectPartnerByCode,
  createPhoneVerification,
  verifyPhoneCode,
  updateUser,
  getUserById,
  ensureChecklistItem,
  createPartnerInviteCode,
  toggleCommunityLike,
  checkAnalyticsIngestRateLimit,
  createSystemNotification,
  hasSentDailyReminderRecently,
  addWater,
  addCalories,
  getWellnessToday,
  incrementKicks,
  getKicksToday,
  hasLoggedToday,
  incrementDailyChatUsage,
  decrementDailyChatUsage,
  getCommunityStats,
  saveChatMessage,
  grantPremium,
  revokePremium,
  removeStaleChecklistItems,
  listChecklistItems,
  saveOnboardingProfile,
  getOnboardingProfile,
  completeChecklistItem,
} from "../src/server/repo";
import { getChatAccess, FREE_MESSAGE_ALLOWANCE } from "../src/server/chat-access";
import { hashAdminPassword, verifyAdminPasswordHash } from "../src/server/admin-auth";
import { buildCycleResponse } from "../src/server/views";
import { tashkentDateStr } from "@mammoai/shared";

let failures = 0;
let checks = 0;

function assert(condition: unknown, message: string): void {
  checks++;
  if (!condition) {
    failures++;
    console.error(`✗ FAIL: ${message}`);
  } else {
    console.log(`✓ ${message}`);
  }
}

async function main() {
  await ensureSchema();
  const userId = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${userId}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;

  try {
    // --- 1. Boshlang'ich holat: hech narsa qayd etilmagan ---
    const initialSettings = await getCycleSettings(userId);
    assert(initialSettings.lastPeriodStart === null, "boshlang'ich lastPeriodStart null");

    const initialResponse = await buildCycleResponse(userId);
    assert(initialResponse.prediction === null, "oxirgi hayz sanasi yo'qligida bashorat null (fabrikatsiya qilinmaydi)");

    // --- 2. Birinchi hayzning 1-kuni qayd etiladi ---
    await upsertCycleLog(userId, { date: "2026-01-01", flow: "heavy", mood: null, symptoms: [] });
    let settings = await getCycleSettings(userId);
    assert(
      (await buildCycleResponse(userId, "2026-01-05")).prediction!.lastPeriodStart === "2026-01-01",
      "1-kun qayd etilgach bashorat langari = 2026-01-01"
    );

    let response = await buildCycleResponse(userId, "2026-01-05");
    assert(response.prediction !== null, "1 kunlik tarixda ham bashorat mavjud (standart qiymatga tayanib)");
    assert(response.prediction!.cyclesAnalyzed === 0, "hali 2 tadan kam sikl aniqlangan — cyclesAnalyzed 0 (taxminiy)");
    assert(response.prediction!.confidence === "insufficient", "shuning uchun ishonch darajasi 'insufficient'");

    // --- 3. CYCLE-001 REGRESSION: hayzning 2-, 3-kuni qayd etiladi ---
    // Bu aynan bugun tuzatilgan bug: 2-, 3-kunni qayd etish lastPeriodStart'ni
    // "bugun"ga surib yubormasligi kerak — bir xil hayz davom etmoqda.
    await upsertCycleLog(userId, { date: "2026-01-02", flow: "medium", mood: "tired", symptoms: ["cramps"] });
    settings = await getCycleSettings(userId);
    assert(
      (await buildCycleResponse(userId, "2026-01-05")).prediction!.lastPeriodStart === "2026-01-01",
      "CYCLE-001: 2-kunni qayd etish langarni SURMAYDI"
    );

    await upsertCycleLog(userId, { date: "2026-01-03", flow: "light", mood: null, symptoms: [] });
    settings = await getCycleSettings(userId);
    assert(
      (await buildCycleResponse(userId, "2026-01-05")).prediction!.lastPeriodStart === "2026-01-01",
      "CYCLE-001: 3-kunni qayd etish ham langarni SURMAYDI"
    );

    // --- 4. Haqiqiy YANGI hayz — real bo'shliqdan keyin (2026-01-29, 28 kun keyin) ---
    await upsertCycleLog(userId, { date: "2026-01-29", flow: "medium", mood: null, symptoms: [] });
    settings = await getCycleSettings(userId);
    assert(
      (await buildCycleResponse(userId, "2026-01-30")).prediction!.lastPeriodStart === "2026-01-29",
      "haqiqiy yangi hayz (28 kunlik bo'shliqdan keyin) langarni to'g'ri suradi"
    );

    response = await buildCycleResponse(userId, "2026-01-30");
    assert(response.prediction!.cyclesAnalyzed >= 1, "endi kamida 1 ta sikl uzunligi aniqlangan (2 ta boshlanish)");
    assert(response.prediction!.confidence === "low", "1-2 sikl bilan ishonch darajasi 'low'");

    // --- 5. Tahrirlash: mavjud kunga faqat kayfiyat qo'shish oqimni o'zgartirmaydi ---
    await upsertCycleLog(userId, { date: "2026-01-29", flow: "medium", mood: "calm", symptoms: [] });
    settings = await getCycleSettings(userId);
    assert(
      (await buildCycleResponse(userId, "2026-01-30")).prediction!.lastPeriodStart === "2026-01-29",
      "faqat kayfiyatni tahrirlash langarni o'zgartirmaydi"
    );

    // --- 6. Oqimni bekor qilish (flow'ni null qilish) — CYCLE-002 tuzatishi ---
    // Ikkinchi hayzning yagona kuni "bekor qilinsa", faqat birinchi hayz qoladi
    // — lastPeriodStart 2026-01-01'ga QAYTISHI kerak.
    await upsertCycleLog(userId, { date: "2026-01-29", flow: null, mood: "calm", symptoms: [] });
    settings = await getCycleSettings(userId);
    assert(
      (await buildCycleResponse(userId, "2026-01-30")).prediction!.lastPeriodStart === "2026-01-01",
      "CYCLE-002: oqimni bekor qilish langarni to'g'ri qayta hisoblaydi"
    );

    // --- 7. O'chirish: kunni butunlay o'chirish ---
    await upsertCycleLog(userId, { date: "2026-01-29", flow: "medium", mood: null, symptoms: [] }); // qayta tiklaymiz
    await deleteCycleLog(userId, "2026-01-29");
    const logsAfterDelete = await listCycleLogs(userId);
    assert(!logsAfterDelete.some((l) => l.date === "2026-01-29"), "o'chirilgan kun ro'yxatda endi yo'q");
    settings = await getCycleSettings(userId);
    assert(
      (await buildCycleResponse(userId, "2026-01-30")).prediction!.lastPeriodStart === "2026-01-01",
      "o'chirishdan keyin ham langar to'g'ri qayta hisoblanadi"
    );

    // --- 8. Sikl uzunligini o'zgartirish ---
    await updateCycleSettings(userId, { averageCycleLength: 35 });
    settings = await getCycleSettings(userId);
    assert(settings.averageCycleLength === 35, "sikl uzunligi sozlamasi saqlanadi");
    response = await buildCycleResponse(userId, "2026-01-10");
    assert(response.prediction!.nextPeriodStart === "2026-02-05", "yangi sikl uzunligi bashoratga darhol ta'sir qiladi (2026-01-01 + 35)");
  } finally {
    await sql`DELETE FROM users WHERE id = ${userId}`;
  }

  // --- FIX-01: onboarding'da qo'lda kiritilgan sana flow'siz log bilan o'chib ketmasligi kerak ---
  const userFix01 = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${userFix01}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  try {
    // Onboarding — cycle_logs'da hech qanday yozuv yo'q, faqat sozlama to'g'ridan-to'g'ri yoziladi.
    await updateCycleSettings(userFix01, { lastPeriodStart: "2026-03-01", averageCycleLength: 28, averagePeriodLength: 5 });
    // Foydalanuvchi flow'siz (faqat kayfiyat) log qo'shadi.
    await upsertCycleLog(userFix01, { date: "2026-03-10", flow: null, mood: "happy", symptoms: [] });
    const settingsFix01 = await getCycleSettings(userFix01);
    assert(settingsFix01.lastPeriodStart === "2026-03-01", "FIX-01: qo'lda kiritilgan sana flow'siz log bilan o'chib ketmaydi");
  } finally {
    await sql`DELETE FROM users WHERE id = ${userFix01}`;
  }

  // --- COMM-001: shikoyat va bloklash ---
  const userA = randomUUID();
  const userB = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${userA}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${userB}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  try {
    const post = await createCommunityPost(userA, { tag: "general", body: "Test post", isAnonymous: false });

    const before = await listCommunityPosts(userB, {});
    assert(before.posts.some((p) => p.id === post.id), "bloklashdan oldin postni ko'ra oladi");

    await createCommunityReport(userB, { targetType: "post", postId: post.id, reason: "spam" });
    const reports = await listOpenCommunityReports();
    assert(reports.some((r) => r.postId === post.id && r.status === "open"), "COMM-001: shikoyat ochiq navbatga tushadi");
    const postReport = reports.find((r) => r.postId === post.id)!;
    assert(postReport.targetExists === true, "FIX-02: post haqidagi shikoyatda mavjud post 'o'chirilgan' deb ko'rsatilmaydi");

    // FIX-04: mavjud bo'lmagan izohga shikoyat — toza 404, FK xatosi emas.
    try {
      await createCommunityReport(userB, { targetType: "comment", postId: post.id, commentId: randomUUID(), reason: "spam" });
      assert(false, "FIX-04: mavjud bo'lmagan izohga shikoyat xato tashlashi kerak edi");
    } catch (err) {
      assert(err instanceof ApiError && err.status === 404, "FIX-04: mavjud bo'lmagan izohga shikoyat toza 404 qaytaradi (FK xatosi emas)");
    }

    await blockCommunityPostAuthor(userB, post.id);
    const afterBlock = await listCommunityPosts(userB, {});
    assert(!afterBlock.posts.some((p) => p.id === post.id), "COMM-001: bloklangan muallifning posti endi ko'rinmaydi");

    const report = reports.find((r) => r.postId === post.id)!;
    await resolveCommunityReport(report.id, "resolved");
    const reportsAfterResolve = await listOpenCommunityReports();
    assert(!reportsAfterResolve.some((r) => r.id === report.id), "ko'rib chiqilgan shikoyat ochiq navbatda qolmaydi");

    await unblockUser(userB, userA);
    const afterUnblock = await listCommunityPosts(userB, {});
    assert(afterUnblock.posts.some((p) => p.id === post.id), "COMM-001: blokdan chiqarilgach post yana ko'rinadi");
  } finally {
    await sql`DELETE FROM users WHERE id = ${userA}`;
    await sql`DELETE FROM users WHERE id = ${userB}`;
  }

  // --- ADMIN-001: alohida admin hisoblari va audit-jurnal ---
  const adminEmail = `test-${randomUUID()}@mammoai.test`;
  let createdAdminId: string | null = null;
  try {
    const created = await createAdminUser(adminEmail, hashAdminPassword("correct-horse-battery"), "Test Admin");
    createdAdminId = created.id;

    const found = await findAdminUserByEmail(adminEmail);
    assert(!!found, "ADMIN-001: yangi admin email bo'yicha topiladi");
    assert(found && verifyAdminPasswordHash("correct-horse-battery", found.passwordHash), "to'g'ri parol bilan tasdiqlanadi");
    assert(found && !verifyAdminPasswordHash("wrong-password", found.passwordHash), "noto'g'ri parol rad etiladi");

    await logAdminAction("Test Admin", "premium_granted", "user=abc123");
    const log = await listAdminAuditLog(5);
    assert(log.some((l) => l.adminLabel === "Test Admin" && l.action === "premium_granted"), "amal audit-jurnalga yoziladi");

    // FIX-03: requireAdmin() shu funksiyaga tayanadi — admin o'chirilgach false qaytarishi kerak.
    assert(await adminUserExistsById(createdAdminId), "FIX-03: hisob mavjud ekanida true qaytaradi");
    await deleteAdminUser(createdAdminId);
    assert(!(await adminUserExistsById(createdAdminId)), "FIX-03: o'chirilgan hisob uchun false qaytaradi (eski sessiya endi rad etiladi)");
    createdAdminId = null; // finally blokida ikkinchi marta o'chirishga urinmaslik uchun
  } finally {
    if (createdAdminId) await deleteAdminUser(createdAdminId);
  }

  // --- CONTENT-001: homiladorlik haftalik kontenti ---
  const emptyContent = await getPregnancyWeekContent(17);
  assert(emptyContent === null, "CONTENT-001: hali kiritilmagan hafta uchun null qaytadi (chaqiruvchi eski tizimga tushadi)");

  await upsertPregnancyWeekContent(17, { sizeLabel: "nok", babyDevelopment: "Test rivojlanish matni", motherChanges: "Test o'zgarish matni" });
  const filled = await getPregnancyWeekContent(17);
  assert(filled?.sizeLabel === "nok", "kiritilgandan keyin to'g'ri qiymat qaytadi");

  await upsertPregnancyWeekContent(17, { sizeLabel: "olma", babyDevelopment: "Yangilangan matn", motherChanges: "Yangilangan matn 2" });
  const updated = await getPregnancyWeekContent(17);
  assert(updated?.sizeLabel === "olma", "qayta yozish (upsert) eskisini yangilaydi, ikkinchi qator yaratmaydi");
  await sql`DELETE FROM pregnancy_week_content WHERE week = 17`;

  // --- FIX-03: hamkor kodini qo'pol kuch bilan sinashga qarshi rate-limit ---
  const rateUser = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${rateUser}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  try {
    let sawRateLimit = false;
    for (let i = 0; i < 7; i++) {
      try {
        await connectPartnerByCode(rateUser, "MAMMO-NOTREAL1");
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          sawRateLimit = true;
          break;
        }
        // 404 ("kod topilmadi") kutilgan holat — urinishlar davom etadi.
      }
    }
    assert(sawRateLimit, "FIX-03: 5 tadan ortiq tez urinishdan keyin rate-limit (429) ishga tushadi");
  } finally {
    await sql`DELETE FROM partner_connect_attempts WHERE user_id = ${rateUser}`;
    await sql`DELETE FROM users WHERE id = ${rateUser}`;
  }

  // --- FIX-04: OTP kodini qo'pol kuch bilan sinashga qarshi urinishlar chegarasi ---
  const { token: otpToken } = await createPhoneVerification("+998900000099", "uz");
  await sql`UPDATE phone_verifications SET code = '123456' WHERE token = ${otpToken}`;
  for (let i = 0; i < 5; i++) {
    const result = await verifyPhoneCode(otpToken, "000000");
    assert(result === null, `noto'g'ri kod ${i + 1}-urinishda ham rad etiladi`);
  }
  const afterLimit = await verifyPhoneCode(otpToken, "123456"); // endi TO'G'RI kod ham
  assert(afterLimit === null, "FIX-04: 5 ta noto'g'ri urinishdan keyin TO'G'RI kod ham qabul qilinmaydi (token bekor qilingan)");
  await sql`DELETE FROM phone_verifications WHERE token = ${otpToken}`;

  // --- FIX-10: updateUser endi faqat patch qilingan ustunlarni yozadi (lost-update yo'q) ---
  const raceUser = randomUUID();
  await sql`INSERT INTO users (id, name, phone, language, created_at) VALUES (${raceUser}, ${"Boshlang'ich"}, ${"+9989" + Math.floor(Math.random() * 1e8)}, 'uz', now()::text)`;
  // Ikkita "parallel" PATCH — biri faqat ismni, ikkinchisi faqat tilni o'zgartiradi.
  // Eski (o'qi-birlashtir-yoz) kodda ikkinchisi birinchisining eskirgan nusxasi
  // ustidan yozib, ismni "Boshlang'ich"ga qaytarib qo'yishi mumkin edi.
  await Promise.all([updateUser(raceUser, { name: "Yangi ism" }), updateUser(raceUser, { language: "ru" })]);
  const afterRace = await getUserById(raceUser);
  assert(afterRace?.name === "Yangi ism", "FIX-10: parallel PATCH'dan keyin ism o'zgarishi yo'qolmaydi");
  assert(afterRace?.language === "ru", "FIX-10: parallel PATCH'dan keyin til o'zgarishi yo'qolmaydi");
  await sql`DELETE FROM users WHERE id = ${raceUser}`;

  // --- FIX-UX-03: checklist_items(user_id, type) endi UNIQUE — dublikat bo'lmaydi ---
  const checklistUser = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${checklistUser}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  await Promise.all([
    ensureChecklistItem(checklistUser, "gyn_annual_checkup", "2027-01-01"),
    ensureChecklistItem(checklistUser, "gyn_annual_checkup", "2027-01-01"),
    ensureChecklistItem(checklistUser, "gyn_annual_checkup", "2027-01-01"),
  ]);
  const checklistRows = (await sql`SELECT id FROM checklist_items WHERE user_id = ${checklistUser} AND type = 'gyn_annual_checkup'`) as unknown as { id: string }[];
  assert(checklistRows.length === 1, "FIX-UX-03: bir xil turdagi checklist bandi ikki marta yaratilmaydi (parallel chaqiruv)");
  // Bajarilgandan keyin ham qayta chaqirilsa — YANGI dublikat qator (eski
  // 'done' + yangi 'pending') paydo bo'lmasligi kerak, ON CONFLICT jim o'tkazadi.
  await sql`UPDATE checklist_items SET status = 'done' WHERE user_id = ${checklistUser} AND type = 'gyn_annual_checkup'`;
  await ensureChecklistItem(checklistUser, "gyn_annual_checkup", "2027-01-01");
  const afterDoneRows = (await sql`SELECT id, status FROM checklist_items WHERE user_id = ${checklistUser} AND type = 'gyn_annual_checkup'`) as unknown as { id: string; status: string }[];
  assert(afterDoneRows.length === 1 && afterDoneRows[0].status === "done", "FIX-UX-03: 'done' bandi yonida yangi 'pending' dublikat yaratilmaydi");
  await sql`DELETE FROM checklist_items WHERE user_id = ${checklistUser}`;
  await sql`DELETE FROM users WHERE id = ${checklistUser}`;

  // --- FIX2-27: partner_links'da bir foydalanuvchi ikki hamkorga bir vaqtda ulanolmaydi ---
  const acceptor = randomUUID();
  const inviterA = randomUUID();
  const inviterB = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES
    (${acceptor}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text),
    (${inviterA}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text),
    (${inviterB}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  const [codeA, codeB] = await Promise.all([createPartnerInviteCode(inviterA), createPartnerInviteCode(inviterB)]);
  // Bitta acceptor IKKITA hamkorga "bir vaqtda" ulanishga urinadi.
  const raceResults = await Promise.allSettled([connectPartnerByCode(acceptor, codeA), connectPartnerByCode(acceptor, codeB)]);
  const succeededCount = raceResults.filter((r) => r.status === "fulfilled").length;
  assert(succeededCount === 1, "FIX2-27: parallel connectPartnerByCode'dan faqat BITTASI muvaffaqiyatli bo'ladi");
  const linkRows = (await sql`SELECT id FROM partner_links WHERE user_b_id = ${acceptor}`) as unknown as { id: string }[];
  assert(linkRows.length === 1, "FIX2-27: acceptor faqat BITTA hamkorga ulangan bo'lib qoladi (bazada ham)");
  await sql`DELETE FROM partner_links WHERE user_a_id IN (${inviterA}, ${inviterB}) OR user_b_id = ${acceptor}`;
  await sql`DELETE FROM partner_invites WHERE inviter_user_id IN (${inviterA}, ${inviterB})`;
  await sql`DELETE FROM partner_connect_attempts WHERE user_id = ${acceptor}`;
  await sql`DELETE FROM users WHERE id IN (${acceptor}, ${inviterA}, ${inviterB})`;

  // --- FIX2-28: likes_count parallel bosishdan keyin ham haqiqiy like'lar soniga mos keladi ---
  const likeUser = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${likeUser}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  const likePost = await createCommunityPost(likeUser, { tag: "general", body: "FIX2-28 test posti", isAnonymous: false });
  // Bir xil foydalanuvchi bir postni "bir vaqtda" ikki marta yoqtiradi
  // (masalan tez-tez bosish) — ON CONFLICT DO NOTHING ikkinchisida hech
  // narsa qo'shmaydi, lekin eski kod baribir likes_count'ni 2ga oshirardi.
  await Promise.all([toggleCommunityLike(likeUser, likePost.id), toggleCommunityLike(likeUser, likePost.id)]);
  const likeCountRow = (await sql`SELECT likes_count FROM community_posts WHERE id = ${likePost.id}`) as unknown as { likes_count: number }[];
  const realLikeRows = (await sql`SELECT COUNT(*)::int AS c FROM community_post_likes WHERE post_id = ${likePost.id}`) as unknown as { c: number }[];
  assert(
    likeCountRow[0].likes_count === realLikeRows[0].c,
    `FIX2-28: likes_count (${likeCountRow[0].likes_count}) haqiqiy like qatorlari soniga (${realLikeRows[0].c}) mos keladi`
  );
  await sql`DELETE FROM community_post_likes WHERE post_id = ${likePost.id}`;
  await sql`DELETE FROM community_posts WHERE id = ${likePost.id}`;
  await sql`DELETE FROM users WHERE id = ${likeUser}`;

  // --- FIX2-24: /api/analytics/events IP bo'yicha rate-limit ---
  const testIp = `203.0.113.${Math.floor(Math.random() * 255)}`; // TEST-NET-3 (RFC 5737)
  let sawAnalyticsRateLimit = false;
  for (let i = 0; i < 25; i++) {
    try {
      await checkAnalyticsIngestRateLimit(testIp);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        sawAnalyticsRateLimit = true;
        break;
      }
      throw err;
    }
  }
  assert(sawAnalyticsRateLimit, "FIX2-24: bitta IP'dan 20 tadan ortiq tez so'rovdan keyin rate-limit (429) ishga tushadi");
  await sql`DELETE FROM analytics_ingest_attempts WHERE ip_key = ${testIp}`;

  // --- FIX2-25: kunlik eslatma idempotentligi (cron ikki marta chaqirilsa ham bir marta) ---
  const reminderUser = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${reminderUser}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  assert(!(await hasSentDailyReminderRecently(reminderUser)), "FIX2-25: hali eslatma yuborilmagan foydalanuvchi uchun false");
  await createSystemNotification(reminderUser, "daily_reminder", "Test eslatma xabari");
  assert(await hasSentDailyReminderRecently(reminderUser), "FIX2-25: eslatma yuborilgandan keyin true (cron ikkinchi marta yubormaydi)");
  await sql`DELETE FROM notifications WHERE user_id = ${reminderUser}`;
  await sql`DELETE FROM users WHERE id = ${reminderUser}`;

  // --- FIX2-26: mavjud kunni tahrirlash logsCount o'zgarmasa ham updated_at'ni yangilaydi ---
  const insightUser = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${insightUser}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  await upsertCycleLog(insightUser, { date: "2026-04-01", flow: "medium", mood: "happy", symptoms: [] });
  const countBefore = await countCycleLogs(insightUser);
  const updatedAtBefore = await getMaxCycleLogUpdatedAt(insightUser);
  await new Promise((resolve) => setTimeout(resolve, 10)); // updated_at millisekund farqi kafolatlansin
  // Bir xil kun — faqat kayfiyat tahrirlanadi, yangi yozuv qo'shilmaydi.
  await upsertCycleLog(insightUser, { date: "2026-04-01", flow: "medium", mood: "sad", symptoms: ["cramps"] });
  const countAfter = await countCycleLogs(insightUser);
  const updatedAtAfter = await getMaxCycleLogUpdatedAt(insightUser);
  assert(countBefore === countAfter, "FIX2-26: mavjud kunni tahrirlash yozuvlar sonini o'zgartirmaydi");
  assert(updatedAtBefore !== updatedAtAfter, "FIX2-26: mavjud kunni tahrirlash updated_at'ni yangilaydi (logsCount o'zgarmasa ham AI keshi eskirgan deb topiladi)");
  await sql`DELETE FROM cycle_logs WHERE user_id = ${insightUser}`;
  await sql`DELETE FROM users WHERE id = ${insightUser}`;

  // --- DATA-ACCURACY-04: repo.ts'ning ichki `today()`si endi tashkentDateStr()
  // ga asoslanadi (avval server UTC vaqtidan olinardi — Toshkent mahalliy
  // 00:00-04:59 oralig'ida bir kun orqada qolardi). Bu yerda suv/kaloriya/
  // tepish/AI-chat kunlik hisoblagichlarining KO'P MARTA chaqirilganda TO'G'RI
  // yig'ilishini va "bugun" sifatida haqiqiy Toshkent sanasini ishlatishini
  // tekshiramiz. ---
  const wellnessUser = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${wellnessUser}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;

  const expectedToday = tashkentDateStr();

  const afterFirstGlass = await addWater(wellnessUser, 250);
  assert(afterFirstGlass.waterMl === 250, "addWater: birinchi qo'shishdan keyin 250ml");
  assert(afterFirstGlass.date === expectedToday, "addWater: `date` haqiqiy Toshkent sanasiga teng (server UTC'ga emas)");

  const afterSecondGlass = await addWater(wellnessUser, 300);
  assert(afterSecondGlass.waterMl === 550, "addWater: ikkinchi marta qo'shilganda JAMI to'g'ri yig'iladi (250+300=550)");

  const afterUndo = await addWater(wellnessUser, -1000);
  assert(afterUndo.waterMl === 0, "addWater: manfiy delta (bekor qilish) 0 dan pastga tushmaydi (GREATEST floor)");

  const afterCal1 = await addCalories(wellnessUser, 200);
  const afterCal2 = await addCalories(wellnessUser, 150);
  assert(afterCal2.calories === 350, "addCalories: bir necha marta qo'shilganda jami to'g'ri yig'iladi (200+150=350)");
  assert(afterCal1.waterMl === 0 && afterCal2.waterMl === 0, "addCalories: suv qiymatiga ta'sir qilmaydi (mustaqil ustunlar)");

  const wellnessSnapshot = await getWellnessToday(wellnessUser);
  assert(
    wellnessSnapshot.waterMl === 0 && wellnessSnapshot.calories === 350,
    "getWellnessToday: addWater/addCalories orqali yig'ilgan qiymatlarni to'g'ri qaytaradi"
  );

  const kicksAfter1 = await incrementKicks(wellnessUser);
  const kicksAfter2 = await incrementKicks(wellnessUser);
  assert(kicksAfter1 === 1 && kicksAfter2 === 2, "incrementKicks: ketma-ket chaqiruvlar 1, 2 qaytaradi (jami to'g'ri yig'iladi)");
  assert((await getKicksToday(wellnessUser)) === 2, "getKicksToday: incrementKicks bilan bir xil jamini ko'radi");

  assert(!(await hasLoggedToday(wellnessUser)), "hasLoggedToday: hali cycle_log yo'q bo'lsa false");
  await upsertCycleLog(wellnessUser, { date: expectedToday, flow: "medium", mood: null, symptoms: [] });
  assert(await hasLoggedToday(wellnessUser), "hasLoggedToday: bugungi (Toshkent) sanada yozuv bo'lsa true");

  const chatUsage1 = await incrementDailyChatUsage(wellnessUser);
  const chatUsage2 = await incrementDailyChatUsage(wellnessUser);
  assert(chatUsage1 === 1 && chatUsage2 === 2, "incrementDailyChatUsage: ketma-ket chaqiruvlar 1, 2 qaytaradi");
  await decrementDailyChatUsage(wellnessUser);
  const [{ message_count: chatUsageAfterDecrement }] = (await sql`
    SELECT message_count FROM chat_daily_usage WHERE user_id = ${wellnessUser} AND usage_date = ${expectedToday}
  `) as unknown as { message_count: number }[];
  assert(
    chatUsageAfterDecrement === 1,
    "DATA-ACCURACY-02: decrementDailyChatUsage muvaffaqiyatsiz AI urinishidan keyin hisoblagichni to'g'ri qaytaradi (2->1)"
  );

  await sql`DELETE FROM cycle_logs WHERE user_id = ${wellnessUser}`;
  await sql`DELETE FROM wellness_logs WHERE user_id = ${wellnessUser}`;
  await sql`DELETE FROM pregnancy_kicks WHERE user_id = ${wellnessUser}`;
  await sql`DELETE FROM chat_daily_usage WHERE user_id = ${wellnessUser}`;
  await sql`DELETE FROM users WHERE id = ${wellnessUser}`;

  // --- DATA-ACCURACY-05: getAdminStats'dagi "Bugun"/"Shu hafta" endi KALENDAR
  // chegarasidan (Toshkent), aylanuvchi 24soat/7kun oynasidan emas hisoblanadi.
  // Hafta boshlanishi ISO bo'yicha DUSHANBA bo'lishi shart (o'zbek/mintaqaviy
  // "hafta" tushunchasi bilan mos) — bu invariant vaqtdan qat'iy nazar doim
  // to'g'ri bo'lishi kerak. ---
  const [{ week_start_dow: weekStartDow }] = (await sql`
    SELECT extract(isodow FROM date_trunc('week', now() AT TIME ZONE 'Asia/Tashkent'))::int as week_start_dow
  `) as unknown as { week_start_dow: number }[];
  assert(weekStartDow === 1, "DATA-ACCURACY-05: kalendar hafta chegarasi DUSHANBADAN boshlanadi (ISO hafta kuni 1)");

  // --- DATA-ACCURACY-06: getCommunityStats — sinov hisoblari HAQIQIY
  // "a'zolar" soniga qo'shilmasligi, va yangi post darhol "Bugun"ga
  // (postsToday) qo'shilishi kerak. ---
  const statsBeforeTestUser = await getCommunityStats();
  const testAccountId = randomUUID();
  await sql`
    INSERT INTO users (id, phone, created_at, is_test_account)
    VALUES (${testAccountId}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text, TRUE)
  `;
  const statsAfterTestUser = await getCommunityStats();
  assert(
    statsAfterTestUser.totalMembers === statsBeforeTestUser.totalMembers,
    "DATA-ACCURACY-06: is_test_account=TRUE foydalanuvchi 'a'zolar' soniga qo'shilmaydi"
  );

  const realAccountId = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${realAccountId}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  const statsAfterRealUser = await getCommunityStats();
  assert(
    statsAfterRealUser.totalMembers === statsBeforeTestUser.totalMembers + 1,
    "DATA-ACCURACY-06: oddiy (test bo'lmagan) foydalanuvchi 'a'zolar' soniga +1 qo'shadi"
  );

  // ══════════════════════════════════════════════════════════════════════
  // QA-002 (2026-09-22) — sikl sozlamalari va bashorat orasidagi ALOQA.
  //
  // Nega aynan bu: shu hafta topilgan xatolarning deyarli hammasi mantiqda
  // emas, QATLAMLAR ORASIDA edi — bir joy `cycle_settings`ni o'qidi, boshqasi
  // `cycle_logs`dan o'rganilgan qiymatni, va ular mos kelmadi. Sof funksiya
  // testlari (263 ta) buni ushlay olmaydi, chunki har bir funksiya alohida
  // to'g'ri ishlaydi.
  //
  // Ustiga men kodni O'QIB xato xulosa chiqardim ("cycle_settings hech qachon
  // yangilanmaydi"). Quyidagi testlar haqiqiy xatti-harakatni YOZIB qo'yadi,
  // shuning uchun keyingi safar o'qish o'rniga ishga tushirish kifoya.
  // ══════════════════════════════════════════════════════════════════════
  const qaUserId = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${qaUserId}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  try {
    // Onboarding: ayol "siklim 28 kun, hayzim 5 kun" degan.
    await updateCycleSettings(qaUserId, {
      lastPeriodStart: "2026-03-01",
      averageCycleLength: 28,
      averagePeriodLength: 5,
    });

    // Haqiqatda esa sikli 31 kun va hayzi 6 kun davom etadi — uch marta.
    for (const start of ["2026-03-01", "2026-04-01", "2026-05-02"]) {
      for (let i = 0; i < 6; i++) {
        const d = new Date(start + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() + i);
        await upsertCycleLog(qaUserId, { date: d.toISOString().slice(0, 10), flow: "medium", mood: null, symptoms: [] });
      }
    }

    const settingsAfterLogs = await getCycleSettings(qaUserId);
    // HAQIQIY xatti-harakat: langar qaydlardan qayta hisoblanadi...
    assert(
      settingsAfterLogs.lastPeriodStart === "2026-03-01",
      "ARCH-01: cycle_settings AYOL AYTGAN sana bo'lib qoladi — qaydlar unga tegmaydi"
    );
    // ...lekin UZUNLIKLAR onboarding qiymatida qoladi. Bu — sinxronlanmaydigan
    // yagona joy, va aynan shu CYCLE-ALGO-19/23 xatolarining sababi edi.
    assert(
      settingsAfterLogs.averagePeriodLength === 5 && settingsAfterLogs.averageCycleLength === 28,
      "QA-002: uzunliklar esa YANGILANMAYDI — onboarding qiymatida qoladi"
    );

    const qaResponse = await buildCycleResponse(qaUserId, "2026-05-10");
    const qaPrediction = qaResponse.prediction!;

    // CYCLE-ALGO-19/23: o'rganilgan qiymatlar UI'ga yetib borishi SHART —
    // aks holda kalendar `forecast`dan, faza kartasi esa `cycle_settings`dan
    // hisoblab, bitta kun haqida ikki xil gap aytardi.
    assert(
      qaPrediction.averagePeriodLength === 6,
      "CYCLE-ALGO-19: bashorat O'RGANILGAN hayz uzunligini (6) qaytaradi, onboarding qiymatini (5) emas"
    );
    assert(
      qaPrediction.averageCycleLength > 28,
      `CYCLE-ALGO-23: bashorat o'rganilgan sikl uzunligini qaytaradi (${qaPrediction.averageCycleLength} > 28)`
    );
    assert(
      qaPrediction.lastPeriodStart === "2026-05-02",
      "ARCH-01: bashorat langari QAYDLARdan olinadi (ayol aytgan sana emas)"
    );

    // CYCLE-ALGO-23: forecast va prediction BIR XIL langardan chiqadi, ya'ni
    // kalendardagi birinchi bashorat sanasi hero'dagi bilan mos tushadi.
    assert(
      qaResponse.forecast.length > 0 && qaResponse.forecast[0].periodStart === qaPrediction.nextPeriodStart,
      "CYCLE-ALGO-23: kalendardagi birinchi bashorat hero'dagi sana bilan AYNAN bir xil"
    );

    // CYCLE-ALGO-17: tugab bo'lgan sikllar ro'yxatga tushmaydi.
    assert(
      qaResponse.forecast.every((c) => c.periodEnd >= "2026-05-10" || c.periodStartLatest >= "2026-05-10"),
      "CYCLE-ALGO-17: o'tib ketgan sikllar bashorat ro'yxatida YO'Q"
    );

    // CYCLE-ALGO-18: ufq ishonchga bog'liq — bu yerda 2 ta sikl aniqlangan
    // ("low"), ya'ni bir yillik ro'yxat chiqmasligi kerak.
    assert(
      qaResponse.forecast.length <= 6,
      `CYCLE-ALGO-18: kam ishonchda ufq qisqartiriladi (${qaResponse.forecast.length} ta sikl, 13 emas)`
    );

    // BUG-01 TUZATILDI (ARCH-01): barcha hayz qaydlari o'chirilsa, ilova
    // tabiiy ravishda AYOLNING O'Z gapiga qaytadi. Ilgari langar oxirgi
    // o'chirilgan kunda qolib ketardi — orqasida hech qanday qayd yo'q
    // sanadan bashorat qilishda davom etardi (foydalanuvchi buni sezgan:
    // "hamma narsani o'chirdim, lekin hali ham bashorat qilyapti").
    for (const start of ["2026-03-01", "2026-04-01", "2026-05-02"]) {
      for (let i = 0; i < 6; i++) {
        const d = new Date(start + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() + i);
        await deleteCycleLog(qaUserId, d.toISOString().slice(0, 10));
      }
    }

    const logsAfterDelete = await listCycleLogs(qaUserId, 365);
    assert(
      logsAfterDelete.every((l) => !l.flow),
      "QA-002: barcha hayz qaydlari haqiqatan o'chirildi"
    );
    const settingsAfterDelete = await getCycleSettings(qaUserId);
    assert(
      settingsAfterDelete.lastPeriodStart === "2026-03-01",
      "ARCH-01: qaydlar o'chirilsa, ayol onboarding'da aytgan sana joyida qoladi"
    );
    assert(
      (await buildCycleResponse(qaUserId, "2026-05-10")).prediction!.lastPeriodStart === "2026-03-01",
      "BUG-01 TUZATILDI: bashorat ham o'sha sanaga qaytadi, oxirgi o'chirilgan kunga emas"
    );
  } finally {
    await sql`DELETE FROM users WHERE id = ${qaUserId}`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // ONB-SAVE-01 — onboarding yakuni AYNAN route yuboradigan shaklda.
  //
  // Nega bu test bo'lmagani qimmatga tushdi: onboarding POST'i profilni
  // `{ userId, ...body }` bilan quradi va `body` PROFILE-01 maydonlarini
  // umuman yubormaydi. TypeScript buni ushlamaydi (`as` bilan majburlab
  // tiplangan), unit testlar esa bazaga tegmaydi. Natijada production'da
  // HECH KIM onboardingni tugata olmadi — ayollar hamma savolga javob
  // berib, oxirgi ekranda xato olardi.
  //
  // Shuning uchun test AYNAN o'sha to'liq bo'lmagan shaklni yuboradi.
  // ══════════════════════════════════════════════════════════════════════
  const onbUserId = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${onbUserId}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  try {
    // PROFILE-01 maydonlari ATAYLAB berilmagan — route ham shunday yuboradi.
    await saveOnboardingProfile({
      userId: onbUserId,
      name: "Integratsiya testi",
      age: 27,
      isPregnant: false,
      cycleRegularity: "regular",
      familyHistory: null,
      sexuallyActive: null,
      lastCheckup: "unknown",
      primaryGoal: "cycle",
      heardAboutUs: "other",
      typicalSymptoms: [],
      periodAttitude: null,
      healthConditions: [],
      healthConditionsOther: null,
      heightCm: null,
      weightKg: null,
      bloodType: null,
      // `unknown` orqali — bu ATAYLAB to'liq bo'lmagan obyekt: route ham
      // aynan shunday yuboradi va tuzatish shuni ko'tarishi kerak.
    } as unknown as Parameters<typeof saveOnboardingProfile>[0]);

    const saved = await getOnboardingProfile(onbUserId);
    assert(saved !== null, "ONB-SAVE-01: to'liq bo'lmagan profil ham saqlanadi (undefined maydonlar null bo'ladi)");
    assert(
      saved?.hpvVaccinated === null && saved?.smokes === null && saved?.hasGivenBirth === null,
      "ONB-SAVE-01: so'ralmagan PROFILE-01 maydonlari null bo'lib yoziladi, 'yo'q' emas"
    );
  } finally {
    await sql`DELETE FROM users WHERE id = ${onbUserId}`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // PAYWALL-01 — tekshiruvni "bajarildi" deb belgilash hammaga bepul.
  //
  // Nega test: bu QAYTA QO'YILIB QOLISHI oson bo'lgan to'siq edi va u
  // mahsulotning asosiy halqasini bloklagan. Test uni qaytib kelishidan
  // himoya qiladi.
  // ══════════════════════════════════════════════════════════════════════
  const paywallUserId = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${paywallUserId}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  try {
    // `pelvic_ultrasound` — davlat dasturi qoplamaydigan (CHECKLIST_ITEM_IS_FREE
    // = false) band. Ilgari AYNAN shunday bandlar Premium talab qilardi.
    await ensureChecklistItem(paywallUserId, "pelvic_ultrasound", null);
    const item = (await listChecklistItems(paywallUserId)).find((i) => i.type === "pelvic_ultrasound")!;
    await completeChecklistItem(paywallUserId, item.id);
    assert(
      (await listChecklistItems(paywallUserId)).find((i) => i.type === "pelvic_ultrasound")?.status === "done",
      "PAYWALL-01: pullik (davlat qoplamaydigan) tekshiruvni Premiumsiz ham 'bajarildi' deb belgilash mumkin"
    );
  } finally {
    await sql`DELETE FROM users WHERE id = ${paywallUserId}`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // CHECKLIST-PRUNE-01 — eskirgan tekshiruv bandlarini olib tashlash.
  //
  // Nega test kerak: bu O'CHIRUVCHI mantiq, ya'ni xatosi qaytarib
  // bo'lmaydigan zarar beradi. Chegaralari aniq qoplanishi shart.
  // ══════════════════════════════════════════════════════════════════════
  const pruneUserId = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${pruneUserId}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  try {
    await ensureChecklistItem(pruneUserId, "gyn_annual_checkup", null);
    await ensureChecklistItem(pruneUserId, "pregnancy_first_visit", null);
    await ensureChecklistItem(pruneUserId, "flora_smear", null);

    const removed = await removeStaleChecklistItems(pruneUserId, ["gyn_annual_checkup", "flora_smear"]);
    const kept = (await listChecklistItems(pruneUserId)).map((i) => i.type).sort();
    assert(
      removed === 1 && kept.join(",") === "flora_smear,gyn_annual_checkup",
      "CHECKLIST-PRUNE-01: ro'yxatdan chiqqan band o'chiriladi, qolganlariga tegilmaydi"
    );

    // "Bajarildi" — ayolning HAQIQIY tarixi, hech qachon o'chirilmaydi.
    // Holat to'g'ridan-to'g'ri qo'yiladi: `completeChecklistItem` Premium
    // tekshiruvi bilan bog'langan, bu test esa faqat PRUNE mantig'i haqida.
    await sql`UPDATE checklist_items SET status = 'done' WHERE user_id = ${pruneUserId} AND type = 'flora_smear'`;
    await removeStaleChecklistItems(pruneUserId, ["gyn_annual_checkup"]);
    assert(
      (await listChecklistItems(pruneUserId)).some((i) => i.type === "flora_smear" && i.status === "done"),
      "CHECKLIST-PRUNE-01: 'bajarildi' bandi qoida o'zgarsa ham saqlanadi"
    );

    // Bo'sh ro'yxat — haqiqiy holatdan ko'ra ko'proq xatoga o'xshaydi,
    // shuning uchun himoya sifatida HECH NARSA o'chirilmaydi.
    const beforeGuard = (await listChecklistItems(pruneUserId)).length;
    const removedByGuard = await removeStaleChecklistItems(pruneUserId, []);
    assert(
      removedByGuard === 0 && (await listChecklistItems(pruneUserId)).length === beforeGuard,
      "CHECKLIST-PRUNE-01: bo'sh ro'yxat butun rejani supurib tashlamaydi"
    );
  } finally {
    await sql`DELETE FROM users WHERE id = ${pruneUserId}`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // MONETIZE-01 — AI Yordamchining bepul tanishtiruv chegarasi.
  //
  // Nega test kerak: bu QATLAMLAR ORASIDAGI mantiq (chat_messages jadvali →
  // hisoblagich → paywall qarori). Noto'g'ri ishlasa ikki xil zarar bo'ladi:
  // yo hamma bepul cheksiz suhbat qiladi (daromad yo'q), yo hech kim
  // yordamchini sinab ko'rolmaydi (aynan shu holat topilgan edi).
  // ══════════════════════════════════════════════════════════════════════
  const chatUserId = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${chatUserId}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;
  try {
    const fresh = await getChatAccess(chatUserId);
    assert(
      !fresh.hasPremium && fresh.freeMessagesLeft === FREE_MESSAGE_ALLOWANCE && fresh.canSend,
      "MONETIZE-01: yangi foydalanuvchi Premiumsiz ham yordamchiga yoza oladi (bepul chegara to'liq)"
    );

    // Assistant javoblari chegarani SARFLAMASLIGI kerak — aks holda har bir
    // savol ikki barobar hisoblanardi.
    await saveChatMessage(chatUserId, "assistant", "Salom!");
    assert(
      (await getChatAccess(chatUserId)).freeMessagesLeft === FREE_MESSAGE_ALLOWANCE,
      "MONETIZE-01: yordamchining javobi bepul chegaradan yechilmaydi"
    );

    for (let i = 0; i < FREE_MESSAGE_ALLOWANCE; i++) {
      await saveChatMessage(chatUserId, "user", `savol ${i}`);
    }
    const exhausted = await getChatAccess(chatUserId);
    assert(
      exhausted.freeMessagesLeft === 0 && !exhausted.canSend,
      "MONETIZE-01: bepul xabarlar tugagach paywall yoqiladi"
    );

    await grantPremium(chatUserId, { durationDays: 30, note: "integratsiya testi" });
    assert(
      (await getChatAccess(chatUserId)).canSend,
      "MONETIZE-01: Premium obuna bepul chegaradan qat'i nazar suhbatni ochadi"
    );

    await revokePremium(chatUserId);
    assert(
      !(await getChatAccess(chatUserId)).canSend,
      "MONETIZE-01: obuna bekor qilinsa paywall qaytadi (chegara allaqachon sarflangan)"
    );
  } finally {
    await sql`DELETE FROM users WHERE id = ${chatUserId}`;
  }

  const communityPost = await createCommunityPost(realAccountId, { tag: "general", body: "DATA-ACCURACY-06 test posti", isAnonymous: false });
  const statsAfterPost = await getCommunityStats();
  assert(
    statsAfterPost.postsToday === statsAfterRealUser.postsToday + 1 && statsAfterPost.totalPosts === statsAfterRealUser.totalPosts + 1,
    "DATA-ACCURACY-06: yangi post darhol 'Bugun' (kalendar kuni) hisobiga qo'shiladi"
  );

  await sql`DELETE FROM community_posts WHERE id = ${communityPost.id}`;
  await sql`DELETE FROM users WHERE id = ${testAccountId}`;
  await sql`DELETE FROM users WHERE id = ${realAccountId}`;

  console.log(`\n${checks - failures}/${checks} tekshiruv o'tdi.`);
  if (failures > 0) {
    console.error(`${failures} ta tekshiruv MUVAFFAQIYATSIZ.`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error("Integratsiya testi kutilmagan xatolik bilan to'xtadi:", error);
  process.exit(1);
});
