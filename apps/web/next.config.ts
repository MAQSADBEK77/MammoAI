import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev serverni lokal tarmoqdagi boshqa qurilmadan (masalan telefondan,
  // mobil ilovani real qurilmada sinash uchun) ochish mumkin bo'lishi uchun —
  // Next.js standart holatda faqat localhost'dan so'rovlarga ruxsat beradi,
  // boshqa manzillardan kelgan so'rovlarni 403 bilan bloklaydi.
  allowedDevOrigins: ["192.168.1.142", "192.168.1.*"],
};

export default nextConfig;
