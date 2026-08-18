"use client";

import { useEffect } from "react";

/** Registers the PWA/push service worker once, app-wide. Renders nothing. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Not fatal — the site still works without it, just not installable/push-capable.
      });
    }
  }, []);
  return null;
}
