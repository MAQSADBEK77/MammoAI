import webpush from "web-push";
import { getSetting, setSetting } from "./db";

// VAPID keys identify this server to push services (Google/Mozilla/etc.) —
// generated once on first use and persisted in the settings table, the same
// pattern SESSION_SECRET uses in server/auth.ts (auto-generate, never commit).
function ensureVapidKeys(): { publicKey: string; privateKey: string } {
  let publicKey = getSetting("vapid_public_key");
  let privateKey = getSetting("vapid_private_key");
  if (!publicKey || !privateKey) {
    const keys = webpush.generateVAPIDKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    setSetting("vapid_public_key", publicKey);
    setSetting("vapid_private_key", privateKey);
  }
  webpush.setVapidDetails("mailto:admin@mammoai.uz", publicKey, privateKey);
  return { publicKey: publicKey as string, privateKey: privateKey as string };
}

export function getVapidPublicKey(): string {
  return ensureVapidKeys().publicKey;
}

/** Sends one push message. Returns false (and the caller should drop the subscription) on a 404/410 — the subscription is gone. */
export async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string }
): Promise<boolean> {
  ensureVapidKeys();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) return false;
    console.error("push send error:", err instanceof Error ? err.message : err);
    return true; // transient failure — keep the subscription, don't drop it
  }
}
