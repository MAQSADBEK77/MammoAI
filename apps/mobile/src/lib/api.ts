import { createApiClient } from "@mammoai/shared";
import { getToken, setToken } from "./storage";

// Backend — apps/web ichida ishlaydigan Next.js API route'lari (bitta backend,
// ikkala platformaga xizmat qiladi). Telefon localhost'ga ulana olmaydi — shuning
// uchun kompyuteringizning lokal tarmoq IP manzilini EXPO_PUBLIC_API_URL orqali
// bering (masalan: EXPO_PUBLIC_API_URL=http://192.168.1.50:3000). Ko'rsatilmasa,
// Android emulyatori uchun standart manzilga tushamiz.
const DEFAULT_DEV_URL = "http://10.0.2.2:3000"; // Android emulyatoridan hostga yo'l

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_DEV_URL;

export const api = createApiClient({
  baseUrl,
  getAuthToken: getToken,
  onAuthToken: setToken,
});
