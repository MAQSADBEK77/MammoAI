import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/server/session";

/** Faqat shu qurilmadagi sessiyani tugatadi (cookie o'chiriladi) — akkaunt va
 * ma'lumotlar saqlanib qoladi, foydalanuvchi keyinroq telefon raqami orqali
 * qayta kira oladi (onboarding'dagi auth.start — parolsiz). Mobilda cookie
 * ishlatilmagani uchun bu endpoint faqat veb tomonidan chaqiriladi; mobil
 * "Bearer" tokenini shunchaki qurilmadan o'chirib tashlaydi. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
