import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev serverni lokal tarmoqdagi boshqa qurilmadan (masalan telefondan,
  // mobil ilovani real qurilmada sinash uchun) ochish mumkin bo'lishi uchun —
  // Next.js standart holatda faqat localhost'dan so'rovlarga ruxsat beradi,
  // boshqa manzillardan kelgan so'rovlarni 403 bilan bloklaydi.
  allowedDevOrigins: ["192.168.1.142", "192.168.1.*"],

  // WEB3-17: xavfsizlik sarlavhalari.
  //
  // DIQQAT — X-Frame-Options va CSP'ning frame-ancestors direktivasi
  // ATAYLAB BU YERDA YO'Q: sayt Median.co (WebView native ilova) va
  // Telegram Mini App (apps/web/src/app/tg — BotFather'da mammo.uz/tg
  // Mini App manzili sifatida ro'yxatdan o'tgan) orqali HAM iframe/webview
  // ICHIDA ochiladi. Frame-embedding'ni cheklovchi sarlavhalarni haqiqiy
  // qurilmalarda (Median build + Telegram) sinab ko'rmasdan qo'shish shu
  // ikkala kirish yo'lini butunlay buzishi mumkin — shuning uchun keyingi,
  // alohida sinovdan o'tkaziladigan bosqichga qoldirilgan. Pastdagi 3 ta
  // sarlavha esa frame-embedding'ga umuman ta'sir qilmaydi.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // HTTPS'ni majburiy qilish (browser'ga "keyingi so'rovlarni ham
          // faqat HTTPS orqali yubor" deydi). `preload`siz — hstspreload.org
          // ro'yxatiga yozilish deyarli qaytarib bo'lmas qadam, bu yerda
          // shoshilinch qilinmadi.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // Brauzer javob Content-Type'ini "taxmin qilib" boshqacha
          // (masalan ijro etiladigan skript sifatida) talqin qilishining oldini oladi.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Boshqa saytga o'tilganda to'liq URL (so'rov parametrlari bilan)
          // emas, faqat domen yuboriladi — foydalanuvchi maxfiyligi uchun.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
