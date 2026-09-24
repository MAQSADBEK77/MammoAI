import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { findTestAccountByPhone } from "@/server/repo";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/server/session";

/**
 * DEV-LOGIN — FAQAT lokal ishlab chiqish uchun.
 *
 * Nega kerak: veb'dan ro'yxatdan o'tish ATAYLAB o'chirilgan (mahsulot qarori
 * 2026-09-16/17: foydalanuvchilar faqat Telegram Mini App orqali kiradi).
 * Shu sababli brauzer keshi tozalansa, dasturchi ilovaga umuman qayta kira
 * olmay qolardi — sessiyani qo'lda, terminal skripti orqali tiklashga to'g'ri
 * kelardi.
 *
 * XAVFSIZLIK — bu yo'l production'da MAVJUD EMAS:
 *   1) `NODE_ENV !== "development"` bo'lsa 404 qaytadi (Vercel'dagi build
 *      har doim "production", ya'ni route umuman javob bermaydi);
 *   2) faqat `is_test_account` bayrog'i qo'yilgan TEST akkauntga kiradi —
 *      haqiqiy foydalanuvchi hisobiga hech qachon kira olmaydi;
 *   3) hech qanday parol/kalit qabul qilmaydi, ya'ni "zaif parol" xavfi yo'q.
 */

/** scripts/dev-test-user.ts yaratadigan test akkaunt (o'sha yerdagi bilan bir xil). */
const TEST_PHONE = "+998000000000";

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return new NextResponse(null, { status: 404 });
    }

    // Faqat TEST akkaunt — so'rov haqiqiy foydalanuvchi hisobiga hech qachon
    // kira olmaydi (bayroq SQL shartining o'zida).
    const user = await findTestAccountByPhone(TEST_PHONE);
    if (!user) {
      return NextResponse.json(
        { error: "Test akkaunt topilmadi — avval scripts/dev-test-user.ts ni ishga tushiring" },
        { status: 404 }
      );
    }

    // `?next=` — kirgandan keyin qaytadigan manzil (bo'lmasa bosh ekran).
    // XAVFSIZLIK: faqat SHU saytdagi nisbiy yo'l qabul qilinadi. Tekshiruvsiz
    // bo'lsa `?next=https://zararli.example` ochiq-yo'naltirish (open redirect)
    // zaifligini berardi. `//` ham rad etiladi — u protokolga nisbiy manzil,
    // ya'ni boshqa saytga olib ketadi.
    const requestedNext = request.nextUrl.searchParams.get("next");
    const next = requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/asosiy";

    // Manzil ATAYLAB nisbiy. `NextResponse.redirect(new URL(next, request.url))`
    // to'liq manzil quradi va u dev'da DOIM `localhost:3000` bo'lib chiqadi —
    // ya'ni telefondan LAN orqali (`http://192.168.x.x:3000`) kirilganda
    // brauzer telefonning O'ZIDAGI localhost'ga yo'naltirilib, sahifa
    // ochilmasdi. Nisbiy `Location` esa so'rov kelgan xostda qoladi, shuning
    // uchun ilovani haqiqiy telefonda sinash ishlaydi.
    const response = new NextResponse(null, { status: 307, headers: { Location: next } });
    response.cookies.set(SESSION_COOKIE, signSession({ sub: user.id, tokenVersion: user.tokenVersion }), sessionCookieOptions);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
