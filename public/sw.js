// MammoAI service worker — exists for two things:
//   1. PWA installability (a valid manifest + a registered SW).
//   2. Web Push notifications (retest/self-exam reminders for people who
//      haven't linked Telegram) — see the `push` handler below.
//
// Deliberately NOT a full offline-first cache: this app's data (test
// results, admin content) changes often and must never be served stale, so
// only the app shell (the root document) gets a network-first cache purely
// as an offline fallback — no API responses are ever cached.

const SHELL_CACHE = "mammoai-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(["/"])));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return; // never cache API data

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/").then((r) => r ?? Response.error()))
    );
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "MammoAI", body: "" };
  try {
    data = event.data.json();
  } catch {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "MammoAI", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
