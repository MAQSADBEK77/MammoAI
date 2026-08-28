# Ayollar salomatligi — mobil ilova

Expo (React Native) ilovasi — `apps/web`dagi Next.js backend'iga ulanadi, xuddi shu
dizayn va funksiyalarni beradi (`packages/shared` orqali umumiy kod).

## Ishga tushirish

```bash
# repo ildizida, bir marta:
npm install

cp apps/mobile/.env.example apps/mobile/.env
# .env faylida EXPO_PUBLIC_API_URL'ni kompyuteringizning lokal tarmoq IP'siga o'zgartiring
# (masalan http://192.168.1.50:3000) — telefon "localhost"ga ulana olmaydi.

npm run dev:web       # backend fon rejimida ishlab tursin (boshqa terminalda)
npm run dev:mobile    # Expo dev server — QR kodni telefoningizdagi Expo Go bilan skanerlang
```

Batafsil: repo ildizidagi [README.md](../../README.md).
