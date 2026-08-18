// Works in both the browser and Node (server routes) — both expose a global
// `crypto.randomUUID`. Used for client-side draft/option ids; the server
// assigns the authoritative id for anything actually persisted.
export function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
