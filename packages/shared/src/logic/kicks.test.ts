import { describe, expect, it } from "vitest";
import {
  KICK_SESSION_MAX_MIN,
  KICK_TARGET,
  currentKickSession,
  summarizeKickSession,
} from "./kicks";

const T0 = new Date("2026-09-27T10:00:00.000Z");
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60000).toISOString();

describe("summarizeKickSession", () => {
  it("seans yo'q bo'lsa nol va ochiq", () => {
    const s = summarizeKickSession(null, T0);
    expect(s).toEqual({ count: 0, elapsedMin: 0, reachedTarget: false, lowCount: false, open: true });
  });

  it("10 taga yetganda nishon belgilanadi va seans yopiladi", () => {
    const kicks = Array.from({ length: KICK_TARGET }, (_, i) => at(i * 3));
    const s = summarizeKickSession({ startedAt: kicks[0], kicks }, new Date(T0.getTime() + 30 * 60000));
    expect(s.reachedTarget).toBe(true);
    expect(s.lowCount).toBe(false);
    expect(s.open).toBe(false);
  });

  it("2 soat to'lib 10 taga yetmasa — ogohlantirish", () => {
    const kicks = [at(0), at(20), at(60)];
    const s = summarizeKickSession({ startedAt: kicks[0], kicks }, new Date(T0.getTime() + KICK_SESSION_MAX_MIN * 60000));
    expect(s.count).toBe(3);
    expect(s.lowCount).toBe(true);
    expect(s.open).toBe(false);
  });

  it("2 soat to'lmagan bo'lsa ogohlantirilmaydi", () => {
    const kicks = [at(0), at(20)];
    const s = summarizeKickSession({ startedAt: kicks[0], kicks }, new Date(T0.getTime() + 119 * 60000));
    expect(s.lowCount).toBe(false);
    expect(s.open).toBe(true);
    expect(s.elapsedMin).toBe(119);
  });
});

describe("currentKickSession", () => {
  it("yozuv bo'lmasa null", () => {
    expect(currentKickSession([], T0)).toBeNull();
  });

  it("kechagi harakatlar bugungi sanoqqa qo'shilmaydi", () => {
    const yesterday = new Date(T0.getTime() - 26 * 60 * 60000).toISOString();
    expect(currentKickSession([yesterday], T0)).toBeNull();
  });

  it("ketma-ket harakatlarni bitta seansga yig'adi", () => {
    const s = currentKickSession([at(0), at(10), at(25)], new Date(T0.getTime() + 30 * 60000));
    expect(s?.kicks).toHaveLength(3);
    expect(s?.startedAt).toBe(at(0));
  });

  it("eski seansni yangisidan ajratadi", () => {
    // 3 soat oldingi ikki harakat — boshqa seans; oxirgi ikkitasi joriy.
    const times = [at(-180), at(-175), at(0), at(5)];
    const s = currentKickSession(times, new Date(T0.getTime() + 10 * 60000));
    expect(s?.kicks).toEqual([at(0), at(5)]);
  });

  it("tartibsiz kelgan yozuvlarni saralaydi", () => {
    const s = currentKickSession([at(20), at(0), at(10)], new Date(T0.getTime() + 25 * 60000));
    expect(s?.kicks).toEqual([at(0), at(10), at(20)]);
  });
});
