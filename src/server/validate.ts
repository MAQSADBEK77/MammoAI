import { randomUUID } from "node:crypto";
import { ApiError } from "./api-utils";
import type { QuizOption, QuizQuestion } from "@/lib/types";

export function validateQuestionBody(body: unknown) {
  const b = (body ?? {}) as {
    category?: string;
    text?: string;
    order?: number;
    options?: { id?: string; text?: string; score?: number }[];
    translations?: unknown;
  };
  if (!b.text?.trim()) throw new ApiError(400, "Savol matnini kiriting.");
  const options: QuizOption[] = (b.options ?? [])
    .filter((o) => o.text?.trim())
    // Keep the client-supplied option id when present (existing options,
    // freshly assigned by the admin UI for new ones) instead of always
    // minting a new one — translations are keyed by option id, so
    // regenerating it on every save would orphan them immediately.
    .map((o) => ({
      id: typeof o.id === "string" && o.id ? o.id : randomUUID(),
      text: o.text!.trim(),
      score: Number(o.score) || 0,
    }));
  if (options.length < 2) throw new ApiError(400, "Kamida 2 ta javob varianti bo'lishi kerak.");

  const validOptionIds = new Set(options.map((o) => o.id));
  const translations = sanitizeTranslations(b.translations, validOptionIds);

  return { category: b.category?.trim() ?? "", text: b.text.trim(), options, order: b.order ?? 0, translations };
}

/** Drops anything malformed and any option-keyed override whose option no longer exists. */
function sanitizeTranslations(
  input: unknown,
  validOptionIds: Set<string>
): QuizQuestion["translations"] | undefined {
  if (!input || typeof input !== "object") return undefined;
  const out: NonNullable<QuizQuestion["translations"]> = {};

  for (const lang of ["ru", "en"] as const) {
    const entry = (input as Record<string, unknown>)[lang];
    if (!entry || typeof entry !== "object") continue;

    const rawText = (entry as { text?: unknown }).text;
    const text = typeof rawText === "string" ? rawText.trim() : "";

    const rawOptions = (entry as { options?: unknown }).options;
    const options: Record<string, string> = {};
    if (rawOptions && typeof rawOptions === "object") {
      for (const [optionId, value] of Object.entries(rawOptions as Record<string, unknown>)) {
        if (validOptionIds.has(optionId) && typeof value === "string" && value.trim()) {
          options[optionId] = value.trim();
        }
      }
    }

    if (text || Object.keys(options).length > 0) {
      out[lang] = { ...(text ? { text } : {}), ...(Object.keys(options).length ? { options } : {}) };
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}
