import { randomUUID } from "node:crypto";
import { ApiError } from "./api-utils";
import type { QuizOption } from "@/lib/types";

export function validateQuestionBody(body: unknown) {
  const b = (body ?? {}) as {
    category?: string;
    text?: string;
    order?: number;
    options?: { text?: string; score?: number }[];
  };
  if (!b.text?.trim()) throw new ApiError(400, "Savol matnini kiriting.");
  const options: QuizOption[] = (b.options ?? [])
    .filter((o) => o.text?.trim())
    .map((o) => ({ id: randomUUID(), text: o.text!.trim(), score: Number(o.score) || 0 }));
  if (options.length < 2) throw new ApiError(400, "Kamida 2 ta javob varianti bo'lishi kerak.");
  return { category: b.category?.trim() ?? "", text: b.text.trim(), options, order: b.order ?? 0 };
}
