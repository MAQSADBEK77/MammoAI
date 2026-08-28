import uz from "./uz";
import ru from "./ru";
import type { Dictionary } from "./types";
import type { Language } from "../types";

export const dictionaries: Record<Language, Dictionary> = { uz, ru };
export type { Dictionary };
export { uz, ru };
