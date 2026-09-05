import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Avatar } from "react-native-paper";
import clsx from "clsx";
import type { PartnerChatMessage } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Emoji } from "@/components/Emoji";
import { api } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui";

const POLL_INTERVAL_MS = 3000;

/**
 * Hamkor bilan to'liq suhbat — Telegram uslubidagi chat (foydalanuvchi so'roviga
 * ko'ra: avvalgi "bir martalik xabar" oynasi o'rniga). Websocket yo'q, shuning
 * uchun modal ochiq turgandagina polling qiladi (har 3 soniyada).
 */
export function PartnerChatModal({
  visible,
  onClose,
  partnerName,
  partnerAvatarUrl,
}: {
  visible: boolean;
  onClose: () => void;
  partnerName: string;
  partnerAvatarUrl: string | null;
}) {
  const { dict } = useI18n();
  const [messages, setMessages] = useState<PartnerChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<PartnerChatMessage>>(null);

  useEffect(() => {
    if (!visible) return;
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
  }, [visible]);

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

  const initials = partnerName.trim()[0]?.toUpperCase() ?? null;
  // FlatList `inverted` — eng yangi xabar pastda, avtomatik pastga scroll bilan;
  // shuning uchun massiv teskarisiga beriladi.
  const reversedMessages = messages ? [...messages].reverse() : [];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="flex-row items-center gap-3 border-b border-border bg-surface px-4 py-3">
            <Pressable onPress={onClose} className="h-9 w-9 items-center justify-center rounded-full active:bg-surface-muted">
              <MaterialCommunityIcons name="arrow-left" size={22} color="#1F2937" />
            </Pressable>
            {partnerAvatarUrl ? (
              <Avatar.Image size={36} source={{ uri: partnerAvatarUrl }} />
            ) : initials ? (
              <Avatar.Text size={36} label={initials} style={{ backgroundColor: "#FFB3CB" }} />
            ) : (
              <Avatar.Icon size={36} icon={() => <Emoji e="🙂" size={18} />} style={{ backgroundColor: "#FFB3CB" }} />
            )}
            <Text className="font-bold text-text-primary">{partnerName}</Text>
          </View>

          {messages === null ? (
            <View className="flex-1 items-center justify-center">
              <LoadingSpinner label={dict.common.loading} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={reversedMessages}
              inverted
              keyExtractor={(m) => m.id}
              contentContainerClassName="gap-2 px-4 py-4"
              ListEmptyComponent={<Text className="mt-8 text-center text-sm text-text-muted">{dict.partner.chatEmpty}</Text>}
              renderItem={({ item }) => (
                <View className={clsx("flex-row", item.isOwn ? "justify-end" : "justify-start")}>
                  <View
                    className={clsx(
                      "max-w-[80%] rounded-2xl px-4 py-2",
                      item.isOwn ? "rounded-br-md bg-primary" : "rounded-bl-md bg-surface-muted"
                    )}
                  >
                    <Text className={clsx("text-sm leading-relaxed", item.isOwn ? "text-white" : "text-text-primary")}>{item.body}</Text>
                  </View>
                </View>
              )}
            />
          )}

          <View className="flex-row items-center gap-2 border-t border-border bg-surface px-3 py-3">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={dict.partner.messagePlaceholder}
              placeholderTextColor="#9CA3AF"
              className="min-h-[44px] flex-1 rounded-full border border-border bg-background px-4 text-base text-text-primary"
            />
            <Pressable
              onPress={send}
              disabled={!draft.trim() || sending}
              className={clsx("h-11 w-11 items-center justify-center rounded-full bg-primary", (!draft.trim() || sending) && "opacity-50")}
            >
              <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
