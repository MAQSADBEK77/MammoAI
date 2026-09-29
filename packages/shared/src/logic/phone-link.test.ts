import { describe, expect, it } from "vitest";
import { resolvePhoneLink } from "./phone-link";

describe("resolvePhoneLink", () => {
  it("sessiyasiz va hisobsiz — yangi hisob", () => {
    expect(resolvePhoneLink({ currentUserId: null, currentUserHasPhone: false, existingUserId: null })).toEqual({
      kind: "create-account",
    });
  });

  it("telefonsiz hisobga raqam biriktiriladi", () => {
    expect(resolvePhoneLink({ currentUserId: "u1", currentUserHasPhone: false, existingUserId: null })).toEqual({
      kind: "attach-phone",
      userId: "u1",
    });
  });

  it("eski hisob topilsa — O'SHANGA o'tiladi va Telegram ko'chiriladi", () => {
    // Eng muhim holat: ayolning sikl tarixi eski hisobda. Yangi bo'sh
    // hisobni saqlab qolish uning butun tarixini ko'rinmas qilardi.
    expect(resolvePhoneLink({ currentUserId: "yangi", currentUserHasPhone: false, existingUserId: "eski" })).toEqual({
      kind: "switch-to-existing",
      userId: "eski",
      moveTelegramFrom: "yangi",
    });
  });

  it("joriy hisobda TELEFON bo'lsa, Telegram ko'chirilmaydi", () => {
    // Aks holda bu boshqa odamning hisobiga Telegram'ni bog'lash yo'li
    // bo'lardi: o'z raqami bilan kirib, begona hisobni egallash.
    expect(resolvePhoneLink({ currentUserId: "boshqa", currentUserHasPhone: true, existingUserId: "eski" })).toEqual({
      kind: "switch-to-existing",
      userId: "eski",
      moveTelegramFrom: null,
    });
  });

  it("telefon allaqachon shu hisobniki — hech narsa o'zgarmaydi", () => {
    expect(resolvePhoneLink({ currentUserId: "u1", currentUserHasPhone: true, existingUserId: "u1" })).toEqual({
      kind: "already-linked",
      userId: "u1",
    });
  });

  it("sessiyasiz, lekin hisob bor — o'shanga kiriladi", () => {
    expect(resolvePhoneLink({ currentUserId: null, currentUserHasPhone: false, existingUserId: "eski" })).toEqual({
      kind: "switch-to-existing",
      userId: "eski",
      moveTelegramFrom: null,
    });
  });
});
