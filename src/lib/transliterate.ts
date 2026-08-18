/**
 * Uzbek Latin → Uzbek Cyrillic transliteration, following the standard
 * O'zbek lotin↔kirill correspondence. Used to derive the "uz-cyrl" language
 * from the "uz" (Latin) dictionary at runtime, instead of maintaining a
 * fourth parallel translation file by hand — the two scripts are the same
 * language, so this is a mechanical conversion, not a translation.
 *
 * Deliberately conservative about what it touches: URLs, emails, the
 * "MammoAI" brand name, and code-like tokens (passport examples, bot
 * tokens, ALL-CAPS acronyms) are left as-is, since those are meant to be
 * typed/read in Latin regardless of the UI's script.
 */

const APOSTROPHE = "['’‘ʻ`]";
// Longest-match-first digraphs, each as [matcher, lowercase result, uppercase result].
const DIGRAPHS: [RegExp, string, string][] = [
  [new RegExp(`o${APOSTROPHE}`, "i"), "ў", "Ў"],
  [new RegExp(`g${APOSTROPHE}`, "i"), "ғ", "Ғ"],
  [/sh/i, "ш", "Ш"],
  [/ch/i, "ч", "Ч"],
  [/yo/i, "ё", "Ё"],
  [/yu/i, "ю", "Ю"],
  [/ya/i, "я", "Я"],
];

const SINGLE: Record<string, string> = {
  a: "а",
  b: "б",
  d: "д",
  e: "е",
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

function isUpper(ch: string): boolean {
  return ch !== ch.toLowerCase() && ch === ch.toUpperCase();
}

const LATIN_VOWELS = "aeiou";

function transliterateCore(word: string): string {
  let out = "";
  let i = 0;
  while (i < word.length) {
    let matched = false;
    for (const [re, lower, upper] of DIGRAPHS) {
      const two = word.slice(i, i + 2);
      if (re.test(two) && two.length === 2 && /^[a-zA-Z'’‘ʻ`]{2}$/.test(two)) {
        out += isUpper(two[0]) ? upper : lower;
        i += 2;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = word[i];
    const lowerCh = ch.toLowerCase();

    // Standalone tutuq belgisi (not part of an o'/g' digraph, already
    // consumed above) — e.g. "ma'lumot" -> "маълумот".
    if (new RegExp(`^${APOSTROPHE}$`).test(ch)) {
      out += "ъ";
      i += 1;
      continue;
    }

    // "e" is "э" word-initially or right after a vowel, "е" elsewhere —
    // e.g. "erta" -> "эрта" but "sher" -> "шер".
    if (lowerCh === "e") {
      const prev = i > 0 ? word[i - 1].toLowerCase() : "";
      const wordInitialOrAfterVowel = i === 0 || LATIN_VOWELS.includes(prev);
      const e = wordInitialOrAfterVowel ? "э" : "е";
      out += isUpper(ch) ? e.toUpperCase() : e;
      i += 1;
      continue;
    }

    if (SINGLE[lowerCh]) {
      out += isUpper(ch) ? SINGLE[lowerCh].toUpperCase() : SINGLE[lowerCh];
    } else {
      out += ch; // digits, punctuation, already-Cyrillic, anything else
    }
    i += 1;
  }
  return out;
}

/** True for tokens that should stay exactly as written (codes, URLs, emails, acronyms, the brand name). */
function isProtected(word: string): boolean {
  if (word === "MammoAI") return true;
  if (word.includes("@")) return true;
  if (/https?:\/\//.test(word)) return true;
  if (/^[A-Z0-9+\-./:]+$/.test(word) && /\d/.test(word) && /[A-Z]/.test(word)) return true; // e.g. AB1234567, +998901234567
  if (/^[A-Z]{2,}$/.test(word)) return true; // acronyms: PDF, CSV, FAQ, PWA
  return false;
}

/** Splits on whitespace so punctuation glued to words still transliterates, while protected tokens pass through untouched. */
export function latinToCyrillicUz(text: string): string {
  return text
    .split(/(\s+)/)
    .map((chunk) => {
      if (/^\s+$/.test(chunk)) return chunk;
      // Punctuation glued to a word (e.g. "MammoAI?", "(https://...)") must
      // not hide it from the protection check — peel it off, test/convert
      // the bare word, then glue it back on.
      const match = chunk.match(/^(\W*)(.*?)(\W*)$/);
      if (!match) return isProtected(chunk) ? chunk : transliterateCore(chunk);
      const [, lead, core, trail] = match;
      if (!core) return chunk;
      return lead + (isProtected(core) ? core : transliterateCore(core)) + trail;
    })
    .join("");
}

/** Deep-transliterates every string leaf of an object/array, leaving numbers/booleans untouched. Used to derive uz-cyrl dictionaries from their uz source. */
export function deepTransliterate<T>(value: T): T {
  if (typeof value === "string") return latinToCyrillicUz(value) as unknown as T;
  if (Array.isArray(value)) return value.map(deepTransliterate) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = deepTransliterate(v);
    return out as T;
  }
  return value;
}
