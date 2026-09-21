# MammoAI — spetsifikatsiya ("AI Developer Bible")

Bu papka — kod yozishdan OLDIN o'qiladigan hujjatlar.

## Har qanday ish boshlashdan oldin

```
O'QING:
  docs/spec/00_current_state.md     ← nima allaqachon bor
  docs/spec/03_screen_inventory.md  ← ekran nima uchun, qanday holatlari bor
  docs/spec/06_database_schema.md   ← 47 jadval
  docs/spec/07_api_spec.md          ← 99 endpoint
```

## Asosiy qoida

**MammoAI bo'sh sahifa emas.** Production'da ishlayotgan, haqiqiy foydalanuvchilari bor ilova:
~34 800 qator kod, 99 endpoint, 47 jadval, 255 test.

Mavjud arxitekturani o'zgartirmang. Xususan:
- **Sikl algoritmini qayta yozmang** (`packages/shared/src/logic/cycle.ts`) — u haqiqiy foydalanuvchi ma'lumotiga qarshi backtest qilingan. Uni generik formula bilan almashtirish aniqlikni PASAYTIRADI.
- **Baza sxemasini buzuvchi o'zgarish kiritmang** — faqat qo'shimcha (`ADD COLUMN IF NOT EXISTS`).
- **Kirish oqimiga tegmang** — faqat Telegram (mahsulot qarori 2026-09-16/17).
- **Akkauntni o'chirishni "tuzatmang"** — telefon/Telegram izlari ATAYLAB qoladi
  (mahsulot qarori 2026-09-21). Batafsil: `11_privacy_architecture.md` → PRIV-01.

## Holat

| Fayl | Holat |
|---|---|
| `00_current_state.md` | ✅ |
| `03_screen_inventory.md` | ✅ |
| `06_database_schema.md` | ✅ (koddan avtomatik) |
| `07_api_spec.md` | ✅ (koddan avtomatik) |
| `01_product_vision.md` | ⏳ — `docs/technical-spec.md` dan |
| `02_feature_inventory.md` | ⏳ |
| `04_onboarding_flow.md` | ✅ onboarding tahlili + dizayn tavsiyalari |
| `05_illustration_brief.md` | ✅ illyustrator uchun brif (madaniy + texnik talablar) |
| `08_prediction_engine.md` | ⏳ — algoritm hozircha `cycle.ts` izohlarida |
| `09_notification_engine.md` | ⏳ |
| `10_subscription_system.md` | ⏳ |
| `11_privacy_architecture.md` | 🟡 ishlanmoqda — PRIV-01/02 bajarildi |
| `12_security.md` | ⏳ |
| `13_analytics.md` | ⏳ |
| `14_admin_panel.md` | ⏳ |
| `15_testing.md` | ⏳ |
