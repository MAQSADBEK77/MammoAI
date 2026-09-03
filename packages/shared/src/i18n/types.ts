import type uz from "./uz";

// Har bir boshqa til lug'ati aynan shu shaklga mos bo'lishi kerak — TypeScript
// ru.ts'da yetishmagan/ortiqcha kalitlarni compile vaqtida ko'rsatadi.
export type Dictionary = typeof uz;
export type Language = "uz" | "uz-cyrl" | "ru" | "en";
