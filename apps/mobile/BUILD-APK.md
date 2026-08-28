# Android .apk qanday tayyorlanadi

Bu muhitda (Claude Code sandbox) Android SDK yo'q, shuning uchun apk'ni to'g'ridan-to'g'ri
shu yerda yig'ib bo'lmaydi. Buning o'rniga **EAS Build** — Expo'ning bepul bulut xizmati
ishlatiladi: kod Expo serverlariga yuboriladi, u yerda yig'iladi, sizga tayyor `.apk`
havolasi qaytariladi. Kompyuteringizda Android Studio shart emas.

## 1. Bir martalik sozlash

```bash
cd apps/mobile
npx eas login
```

`eas login` sizdan **Expo hisobingiz** (expo.dev) email/parolini so'raydi — agar hisobingiz
yo'q bo'lsa, xuddi shu buyruq orqali bepul ro'yxatdan o'tkazadi.

## 2. MUHIM — backend manzilini sozlang

Telefonga o'rnatiladigan `.apk` sizning kompyuteringizga emas, **internetdagi haqiqiy
backend'ga** ulanishi kerak (aks holda ilova ochilib, lekin hech narsa yuklanmaydi).
Ikki variant:

- **Test uchun (tez, lekin vaqtinchalik):** kompyuteringiz va telefon bir xil Wi-Fi'da
  bo'lsa, `apps/mobile/eas.json` ichidagi `build.preview.env.EXPO_PUBLIC_API_URL`ni
  kompyuteringiz IP'siga o'zgartiring (masalan `http://192.168.1.50:3000`) va backend
  (`npm run dev:web`) ishlab turishi kerak — kompyuter o'chsa/tarmoq almashsa ishlamaydi.
- **Doimiy ishlashi uchun:** `apps/web`ni biror hosting'ga (Vercel, Railway, VPS va h.k.)
  joylashtiring, keyin shu yerdagi manzilni `EXPO_PUBLIC_API_URL`ga qo'ying.

## 3. Apk yig'ish

```bash
npm run build:apk
```

(`apps/mobile/package.json` ichidagi `eas build --platform android --profile preview`
buyrug'i — birinchi marta EAS loyihasini yaratishni so'raydi, "ha" deb javob bering.)

Yig'ish Expo serverlarida ~10-15 daqiqa davom etadi, tugagach terminalda va
[expo.dev](https://expo.dev) hisobingizdagi "Builds" bo'limida yuklab olish havolasi
chiqadi. `.apk`ni telefonga o'tkazib, "noma'lum manbalardan o'rnatish"ga ruxsat berib
o'rnatasiz.
