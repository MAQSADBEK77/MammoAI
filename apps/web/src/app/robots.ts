import type { MetadataRoute } from "next";

// Google va boshqa qidiruv tizimlariga saytni indekslashga ruxsat beradi —
// faqat login/admin talab qiladigan yoki foydalanuvchiga xos sahifalar
// (ilova ichi, admin panel) yashirin qoladi, ochiq sahifalar (bosh sahifa,
// onboarding, QR-baholash) qidiruvga ochiq.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: "https://mammo.uz/sitemap.xml",
  };
}
