/**
 * APPREVIEW-01 — AI'ga ma'lumot yuborishdan OLDIN aniq rozilik.
 *
 * Xabar va sikl/homiladorlik konteksti uchinchi tomon AI provayderiga
 * (server/ai-chat.ts — Gemini / Anthropic / Huawei) ketadi. Apple 5.1.2(i)
 * buni ochiq aytib, ruxsat olishni talab qiladi; to'g'ri amaliyot sifatida
 * barcha platformalarda bir xil. Qaror qurilmada saqlanadi — localStorage
 * ishlamasa (xususiy rejim), shu sessiya davomida xotirada turadi va
 * ayol rozilik oynasida qotib qolmaydi.
 *
 * APPREVIEW-04: Yordamchi ekranidan alohida modulga chiqarildi — Statistika
 * ham AI tahlilini faqat shu rozilik bo'lsa so'raydi.
 */
const AI_CONSENT_KEY = "mammo.aiConsent.v1";
let aiConsentInMemory = false;
const aiConsentListeners = new Set<() => void>();

export function readAiConsent(): boolean {
  if (aiConsentInMemory) return true;
  try {
    return window.localStorage.getItem(AI_CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveAiConsent() {
  aiConsentInMemory = true;
  try {
    window.localStorage.setItem(AI_CONSENT_KEY, "1");
  } catch {
    // Saqlab bo'lmasa ham xotiradagi qiymat yetarli.
  }
  aiConsentListeners.forEach((listener) => listener());
}

export function subscribeAiConsent(listener: () => void) {
  aiConsentListeners.add(listener);
  return () => {
    aiConsentListeners.delete(listener);
  };
}
