import type uz from "./uz";

// Every other language's dictionary must satisfy this exact shape — TypeScript
// will flag missing/extra keys in ru.ts and en.ts at compile time.
export type Dictionary = typeof uz;
export type Language = "uz" | "ru" | "en";
