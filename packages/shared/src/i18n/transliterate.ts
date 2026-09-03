// Lotin -> Kirill (o'zbekcha) transliteratsiyasi — rasmiy o'zbek kirill alifbosi
// qoidalariga asoslangan (sh->ш, ch->ч, o'/g'->ў/ғ, so'z boshidagi "e"->э,
// digraflar yo/yu/ya/ye->ё/ю/я/е, yakka tutuq belgisi->ъ). Alohida lug'at
// yozish o'rniga shu funksiya orqali `uz.ts`dan avtomatik hosil qilinadi —
// shu bilan ikkala yozuv har doim bir xil ma'noda qoladi (uz-cyrl.ts'ga qarang).

const APOSTROPHES = new Set(["'", "ʻ", "ʼ", "‘", "’", "`", "´"]);

const DIGRAPHS: Record<string, string> = {
  sh: "ш",
  ch: "ч",
  ts: "ц",
  yo: "ё",
  yu: "ю",
  ya: "я",
  ye: "е",
};

const SINGLE_MAP: Record<string, string> = {
  a: "а",
  b: "б",
  c: "к",
  d: "д",
  f: "ф",
  g: "г",
  h: "ҳ",
  i: "и",
  j: "ж",
  k: "к",
  l: "л",
  m: "м",
  n: "н",
  o: "о",
  p: "п",
  q: "қ",
  r: "р",
  s: "с",
  t: "т",
  u: "у",
  v: "в",
  x: "х",
  y: "й",
  z: "з",
};

function isLetter(ch: string | undefined): boolean {
  return !!ch && (/[a-z]/i.test(ch) || APOSTROPHES.has(ch));
}

function matchCase(mapped: string, source: string): string {
  const isAllUpper = source === source.toUpperCase() && source !== source.toLowerCase();
  return isAllUpper ? mapped.toUpperCase() : mapped;
}

/** Lotin yozuvidagi matnni o'zbek kirill alifbosiga o'giradi. Raqamlar,
 * tinish belgilari va emoji o'zgarishsiz qoladi. */
export function latinToCyrillicUz(text: string): string {
  let result = "";
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    const lower1 = c.toLowerCase();

    // o' / g' (istalgan tutuq belgisi varianti bilan)
    if ((lower1 === "o" || lower1 === "g") && next && APOSTROPHES.has(next)) {
      const mapped = lower1 === "o" ? "ў" : "ғ";
      result += matchCase(mapped, c);
      i += 2;
      continue;
    }

    // 2 harfli digraflar: sh, ch, yo, yu, ya, ye
    if (next) {
      const pair = (lower1 + next.toLowerCase()) as keyof typeof DIGRAPHS;
      if (DIGRAPHS[pair]) {
        let mapped = DIGRAPHS[pair];
        const bothUpper = c === c.toUpperCase() && next === next.toUpperCase() && /[a-z]/i.test(c);
        const firstUpper = c === c.toUpperCase() && /[a-z]/i.test(c);
        if (bothUpper) mapped = mapped.toUpperCase();
        else if (firstUpper) mapped = mapped.charAt(0).toUpperCase() + mapped.slice(1);
        result += mapped;
        i += 2;
        continue;
      }
    }

    // Yakka tutuq belgisi (masalan "san'at") -> ъ
    if (APOSTROPHES.has(c)) {
      result += "ъ";
      i += 1;
      continue;
    }

    // "e" — so'z boshida "э", aks holda "е"
    if (lower1 === "e") {
      const prev = text[i - 1];
      const isWordStart = i === 0 || !isLetter(prev);
      const mapped = isWordStart ? "э" : "е";
      result += matchCase(mapped, c);
      i += 1;
      continue;
    }

    if (SINGLE_MAP[lower1]) {
      result += matchCase(SINGLE_MAP[lower1], c);
      i += 1;
      continue;
    }

    result += c;
    i += 1;
  }
  return result;
}

/** Berilgan obyektni (satr/funksiya/massiv/ichma-ich obyektlar) chuqur aylanib,
 * har bir matn qiymatini (va funksiya natijasini) kirillga o'giradi — shu
 * orqali `uz.ts` lug'ati bilan bir xil shaklda yangi lug'at hosil bo'ladi. */
export function deepTransliterate<T>(node: T): T {
  if (typeof node === "string") {
    return latinToCyrillicUz(node) as unknown as T;
  }
  if (typeof node === "function") {
    const fn = node as unknown as (...args: unknown[]) => unknown;
    const wrapped = (...args: unknown[]) => {
      const out = fn(...args);
      return typeof out === "string" ? latinToCyrillicUz(out) : out;
    };
    return wrapped as unknown as T;
  }
  if (Array.isArray(node)) {
    return node.map((item) => deepTransliterate(item)) as unknown as T;
  }
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      out[key] = deepTransliterate(value);
    }
    return out as T;
  }
  return node;
}
