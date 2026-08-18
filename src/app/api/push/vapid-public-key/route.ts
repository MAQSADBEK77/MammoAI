import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/server/push";

// Public by design — a VAPID public key is meant to be handed to the
// browser so it can create a push subscription; it's not a secret.
export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}
