"use client";

import { createApiClient } from "@mammoai/shared";

// Veb'da sessiya httpOnly cookie orqali avtomatik yuboriladi — token boshqaruvi kerak emas.
export const api = createApiClient({ baseUrl: "", credentials: "same-origin" });
