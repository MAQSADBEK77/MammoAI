import { describe, expect, it } from "vitest";
import { shouldReloadForNewBuild } from "./stale-build";

describe("shouldReloadForNewBuild", () => {
  it("versiyalar farq qilsa — qayta yuklanadi", () => {
    expect(shouldReloadForNewBuild({ builtCommit: "aaa1111", liveCommit: "bbb2222", alreadyReloadedFor: null })).toBe(true);
  });

  it("bir xil bo'lsa — yo'q", () => {
    expect(shouldReloadForNewBuild({ builtCommit: "aaa1111", liveCommit: "aaa1111", alreadyReloadedFor: null })).toBe(false);
  });

  it("shu commit uchun allaqachon yuklangan bo'lsa — BOSHQA yuklamaydi", () => {
    // Busiz ilova cheksiz aylanardi: eski nusxa qaytib kelsa, yana
    // qayta yuklanardi, va hokazo.
    expect(shouldReloadForNewBuild({ builtCommit: "aaa1111", liveCommit: "bbb2222", alreadyReloadedFor: "bbb2222" })).toBe(false);
  });

  it("lokal ishlab chiqishda hech qachon yuklamaydi", () => {
    expect(shouldReloadForNewBuild({ builtCommit: "local", liveCommit: "bbb2222", alreadyReloadedFor: null })).toBe(false);
    expect(shouldReloadForNewBuild({ builtCommit: null, liveCommit: "bbb2222", alreadyReloadedFor: null })).toBe(false);
    expect(shouldReloadForNewBuild({ builtCommit: "aaa1111", liveCommit: undefined, alreadyReloadedFor: null })).toBe(false);
  });
});
