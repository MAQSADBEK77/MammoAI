"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, Avatar } from "@mui/material";
import { ArrowBackOutlined, SendRounded } from "@mui/icons-material";
import type { PartnerChatMessage } from "@mammoai/shared";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui";

const POLL_INTERVAL_MS = 3000;

/**
 * Hamkor bilan to'liq suhbat — Telegram uslubidagi chat (foydalanuvchi so'roviga
 * ko'ra: avvalgi "bir martalik xabar" modali o'rniga). Websocket infratuzilmasi
 * yo'q, shuning uchun "real vaqt" polling orqali (har 3 soniyada) — dialog ochiq
 * turgandagina, yopilganda to'xtaydi.
 */
export function PartnerChatDialog({
  open,
  onClose,
  partnerName,
  partnerAvatarUrl,
}: {
  open: boolean;
  onClose: () => void;
  partnerName: string;
  partnerAvatarUrl: string | null;
}) {
  const { dict } = useI18n();
  const [messages, setMessages] = useState<PartnerChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await api.partner.chatMessages();
        if (!cancelled) setMessages(res.messages);
      } catch {
        // Polling xatosi jimgina o'tkazib yuboriladi — keyingi urinishda tuzaladi.
      }
    }
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    try {
      const res = await api.partner.sendChatMessage(text);
      setMessages((prev) => [...(prev ?? []), res.message]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <div className="flex h-dvh flex-col bg-background">
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
          <button type="button" onClick={onClose} className="tap-target flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-muted">
            <ArrowBackOutlined sx={{ fontSize: 20 }} />
          </button>
          <Avatar src={partnerAvatarUrl ?? undefined} sx={{ width: 36, height: 36, bgcolor: "var(--color-primary-light)" }}>
            {!partnerAvatarUrl && (partnerName.trim()[0]?.toUpperCase() ?? "🙂")}
          </Avatar>
          <p className="font-bold text-text-primary">{partnerName}</p>
        </div>

        <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {messages === null ? (
            <LoadingSpinner label={dict.common.loading} />
          ) : messages.length === 0 ? (
            <p className="mt-8 text-center text-sm text-text-muted">{dict.partner.chatEmpty}</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={clsx("flex", m.isOwn ? "justify-end" : "justify-start")}>
                <div
                  className={clsx(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed break-words",
                    m.isOwn ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm bg-surface-muted text-text-primary"
                  )}
                >
                  {m.body}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-border bg-surface px-3 py-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={dict.partner.messagePlaceholder}
            className="tap-target flex-1 rounded-full border border-border bg-background px-4 text-sm text-text-primary outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || sending}
            className="tap-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
          >
            <SendRounded sx={{ fontSize: 18 }} />
          </button>
        </div>
      </div>
    </Dialog>
  );
}
