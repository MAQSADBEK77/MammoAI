import type { MetadataRoute } from "next";

// Faqat LOGIN talab qilmaydigan, mazmunli sahifalar — ilova ichidagi
// shaxsiy ekranlar (/asosiy, /profil va h.k.) qidiruv uchun ahamiyatsiz
// (har bir foydalanuvchida boshqacha ko'rinadi), shuning uchun kiritilmaydi.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://mammo.uz";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/baholash`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/onboarding`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/maxfiylik`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
