"use client";

import type { ReactNode } from "react";

/**
 * ARTICLE-FMT-01 — maqola matnini CHIZADI.
 *
 * XABAR QILINGAN MUAMMO: "the styling is just like chat gpt copy pasted
 * texts". Sabab aniq edi — maqola sahifasi butun matnni BITTA `<p>`
 * ichida, `whitespace-pre-line` bilan chiqarardi. Matnlarda esa markdown
 * allaqachon bor edi, ya'ni ayol ekranda `## Qanday o'tadi` va
 * `**Og'riydimi?**` degan belgilarni O'Z KO'ZI BILAN ko'rardi.
 *
 * Bu yerda to'liq markdown kutubxonasi ATAYLAB ishlatilmadi:
 *   • maqolalar matnini faqat biz yozamiz (foydalanuvchi emas), ya'ni
 *     qo'llab-quvvatlanadigan belgilar to'plami kichik va ma'lum;
 *   • `dangerouslySetInnerHTML` umuman ishlatilmaydi — hamma narsa
 *     React elementlari sifatida quriladi, ya'ni HTML in'ektsiyasi
 *     imkoni yo'q. Tibbiy kontentda bu muhim: matn bazadan keladi va
 *     admin panel orqali tahrirlanadi.
 *
 * Qo'llab-quvvatlanadigan belgilar:
 *   ## sarlavha        -> bo'lim sarlavhasi
 *   ### sarlavha       -> kichik sarlavha
 *   - element          -> belgili ro'yxat
 *   1. element         -> raqamli ro'yxat
 *   > matn             -> ajratilgan eslatma (callout)
 *   **qalin**          -> qalin matn
 *   bo'sh qator        -> yangi abzas
 */

/** `**qalin**` bo'laklarini React elementlariga ajratadi. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-bold text-text-primary">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

type Block =
  | { kind: "h2" | "h3" | "p" | "quote"; text: string }
  | { kind: "ul" | "ol"; items: string[] };

function parse(body: string): Block[] {
  const blocks: Block[] = [];
  // Abzaslar bo'sh qator bilan ajratiladi; ro'yxatlar esa bitta blok
  // ichidagi ketma-ket qatorlar bo'lishi mumkin.
  for (const raw of body.trim().split(/\n{2,}/)) {
    const chunk = raw.trim();
    if (!chunk) continue;
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);

    if (lines.every((l) => /^[-•]\s+/.test(l))) {
      blocks.push({ kind: "ul", items: lines.map((l) => l.replace(/^[-•]\s+/, "")) });
      continue;
    }
    if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
      blocks.push({ kind: "ol", items: lines.map((l) => l.replace(/^\d+[.)]\s+/, "")) });
      continue;
    }
    // Aralash blok: har bir qatorni alohida ko'rib chiqamiz.
    for (const line of lines) {
      if (line.startsWith("### ")) blocks.push({ kind: "h3", text: line.slice(4) });
      else if (line.startsWith("## ")) blocks.push({ kind: "h2", text: line.slice(3) });
      else if (line.startsWith("> ")) blocks.push({ kind: "quote", text: line.slice(2) });
      else if (/^[-•]\s+/.test(line)) blocks.push({ kind: "ul", items: [line.replace(/^[-•]\s+/, "")] });
      else blocks.push({ kind: "p", text: line });
    }
  }
  return blocks;
}

export function ArticleBody({ body }: { body: string }) {
  const blocks = parse(body);
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.kind === "h2") {
          return (
            <h2 key={i} className="pt-2 text-xl font-extrabold leading-snug text-text-primary">
              {block.text}
            </h2>
          );
        }
        if (block.kind === "h3") {
          return (
            <h3 key={i} className="pt-1 text-base font-bold text-text-primary">
              {block.text}
            </h3>
          );
        }
        if (block.kind === "quote") {
          return (
            <p
              key={i}
              className="rounded-2xl bg-primary-light/20 px-4 py-3 text-[0.9375rem] leading-relaxed text-text-primary"
            >
              {inline(block.text)}
            </p>
          );
        }
        if (block.kind === "ul" || block.kind === "ol") {
          const List = block.kind === "ol" ? "ol" : "ul";
          return (
            <List key={i} className="space-y-2 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-text-secondary">
                  {block.kind === "ol" ? (
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light/40 text-xs font-bold text-primary-dark">
                      {j + 1}
                    </span>
                  ) : (
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                  <span>{inline(item)}</span>
                </li>
              ))}
            </List>
          );
        }
        // Qolgani — oddiy abzas. TypeScript uchun turni aniq toraytiramiz:
        // yuqoridagi shartlar ro'yxat variantlarini allaqachon chiqarib
        // tashlagan, lekin buni kompilyatorga aytish kerak.
        if (block.kind !== "p") return null;
        return (
          <p key={i} className="text-[0.9375rem] leading-relaxed text-text-secondary">
            {inline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
