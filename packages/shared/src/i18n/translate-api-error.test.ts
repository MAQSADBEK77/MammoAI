import { describe, expect, it } from "vitest";
import { ApiError } from "../api-client";
import { translateApiError } from "./index";
import uz from "./uz";

describe("translateApiError", () => {
  // FIX2-20: server "key" bilan xato qaytarsa, xom o'zbekcha matn o'rniga
  // dict.apiErrors'dan tarjima qilingan matn ko'rsatilishi kerak.
  it("tan olingan key uchun dict.apiErrors'dan tarjima qaytaradi", () => {
    const err = new ApiError(400, "Post matni juda qisqa", "post_too_short");
    expect(translateApiError(err, uz)).toBe(uz.apiErrors.post_too_short);
  });

  it("key bo'lmagan ApiError uchun xom message'ga tushadi (orqaga moslik)", () => {
    const err = new ApiError(404, "Kod topilmadi yoki muddati o'tgan");
    expect(translateApiError(err, uz)).toBe("Kod topilmadi yoki muddati o'tgan");
  });

  it("tan olinmagan key uchun ham xom message'ga tushadi", () => {
    const err = new ApiError(400, "Noma'lum xato", "unknown_key_not_in_dict");
    expect(translateApiError(err, uz)).toBe("Noma'lum xato");
  });

  it("oddiy Error (tarmoq xatosi) uchun error.message'ni qaytaradi", () => {
    expect(translateApiError(new Error("Failed to fetch"), uz)).toBe("Failed to fetch");
  });

  it("Error bo'lmagan qiymat uchun umumiy xatolik matnini qaytaradi", () => {
    expect(translateApiError("string emas Error", uz)).toBe(uz.common.errorGeneric);
  });
});
