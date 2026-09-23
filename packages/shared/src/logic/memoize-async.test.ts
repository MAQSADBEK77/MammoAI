import { describe, expect, it, vi } from "vitest";
import { memoizeAsyncSuccess } from "./memoize-async";

describe("memoizeAsyncSuccess", () => {
  it("muvaffaqiyatli natijani keshlaydi — fn faqat bir marta chaqiriladi", async () => {
    const fn = vi.fn(async () => "natija");
    const memo = memoizeAsyncSuccess(fn);
    expect(await memo()).toBe("natija");
    expect(await memo()).toBe("natija");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("XATONI keshlamaydi — keyingi chaqiruv qaytadan urinadi", async () => {
    let attempt = 0;
    const fn = vi.fn(async () => {
      attempt++;
      if (attempt === 1) throw new Error("vaqtinchalik nosozlik");
      return "tuzaldi";
    });
    const memo = memoizeAsyncSuccess(fn);

    await expect(memo()).rejects.toThrow("vaqtinchalik nosozlik");
    // Aynan SHU xatti-harakat ilgari yo'q edi: birinchi xato abadiy
    // keshlanib, server nusxasi butunlay o'lik qolardi.
    expect(await memo()).toBe("tuzaldi");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("bir vaqtda kelgan chaqiruvlar bitta urinishni bo'lishadi", async () => {
    let resolveIt: ((v: string) => void) | null = null;
    const fn = vi.fn(() => new Promise<string>((resolve) => { resolveIt = resolve; }));
    const memo = memoizeAsyncSuccess(fn);

    const a = memo();
    const b = memo();
    expect(fn).toHaveBeenCalledTimes(1); // parallel "migratsiya bo'roni" yo'q
    resolveIt!("bir marta");
    expect(await a).toBe("bir marta");
    expect(await b).toBe("bir marta");
  });

  it("xatodan keyin muvaffaqiyat kelsa, u keshlanadi", async () => {
    let attempt = 0;
    const fn = vi.fn(async () => {
      attempt++;
      if (attempt === 1) throw new Error("birinchi");
      return attempt;
    });
    const memo = memoizeAsyncSuccess(fn);
    await expect(memo()).rejects.toThrow();
    expect(await memo()).toBe(2);
    expect(await memo()).toBe(2); // qayta chaqirilmaydi
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("onError har bir nosozlikda chaqiriladi", async () => {
    const onError = vi.fn();
    const memo = memoizeAsyncSuccess(async () => {
      throw new Error("doim yiqiladi");
    }, onError);
    await expect(memo()).rejects.toThrow();
    await expect(memo()).rejects.toThrow();
    expect(onError).toHaveBeenCalledTimes(2);
  });
});
