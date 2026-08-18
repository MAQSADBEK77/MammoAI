import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "mammoai_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// ---------------------------------------------------------------------------
// Session secret — auto-generated into .env.local on first run so this works
// out of the box. For a real deployment, set SESSION_SECRET yourself (env
// var or hosting provider's secret manager) instead of relying on the
// generated file.
// ---------------------------------------------------------------------------

function ensureSessionSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;

  const envPath = path.join(process.cwd(), ".env.local");
  const generated = randomBytes(48).toString("hex");

  try {
    const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
    if (!/^SESSION_SECRET=/m.test(existing)) {
      const prefix = existing && !existing.endsWith("\n") ? "\n" : "";
      fs.writeFileSync(
        envPath,
        `${existing}${prefix}# Auto-generated — keep this secret, don't commit it.\nSESSION_SECRET=${generated}\n`
      );
    }
  } catch {
    // Read-only filesystem (some hosting providers) — fall back to an
    // in-memory secret. Sessions won't survive a restart there; set
    // SESSION_SECRET as a real env var to fix that.
  }

  process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? generated;
  return process.env.SESSION_SECRET;
}

const SECRET = ensureSessionSecret();

// ---------------------------------------------------------------------------
// Passwords — scrypt (Node's built-in, no native dependency beyond Node itself)
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// ---------------------------------------------------------------------------
// Session tokens (JWT, stored in an httpOnly cookie)
// ---------------------------------------------------------------------------

interface SessionPayload {
  sub: string; // user id
  ver: number; // must match the user's current token_version — see bumpTokenVersion()
}

/**
 * `tokenVersion` is the user's current `token_version` column value — baked
 * into the token so a "log out of all devices" action (bumpTokenVersion)
 * invalidates every previously issued token at once, without needing a
 * server-side session table to individually revoke.
 */
export function signSession(userId: string, tokenVersion: number): string {
  return jwt.sign({ sub: userId, ver: tokenVersion } satisfies SessionPayload, SECRET, {
    expiresIn: SESSION_MAX_AGE_SECONDS,
  });
}

export function verifySession(token: string): { userId: string; tokenVersion: number } | null {
  try {
    const payload = jwt.verify(token, SECRET) as SessionPayload;
    return { userId: payload.sub, tokenVersion: payload.ver ?? 0 };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
