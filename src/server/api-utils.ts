import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Best-effort client IP — trusts the proxy/tunnel in front of the app (Cloudflare, etc.). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// Every unexpected (non-ApiError) failure is the same shape of "something's
// broken" signal — worth pinging an admin about without them having to tail
// logs. Deduped per error message so a hot-looping bug sends one alert, not
// hundreds; dynamic import avoids a circular dependency (telegram.ts -> db.ts
// -> api-utils.ts).
const recentlyAlerted = new Map<string, number>();
const ALERT_COOLDOWN_MS = 10 * 60 * 1000;

function alertAdminsOfServerError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const last = recentlyAlerted.get(message);
  if (last && Date.now() - last < ALERT_COOLDOWN_MS) return;
  recentlyAlerted.set(message, Date.now());

  import("./telegram")
    .then(({ notifyAdmins }) => notifyAdmins(`🚨 Kutilmagan server xatoligi:\n${message}`))
    .catch(() => {});
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  alertAdminsOfServerError(err);
  return NextResponse.json({ error: "Kutilmagan xatolik yuz berdi." }, { status: 500 });
}
