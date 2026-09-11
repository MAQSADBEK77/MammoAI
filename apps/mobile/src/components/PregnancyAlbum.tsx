// Web'dagi PregnancyAlbum.tsx bilan bir xil naqsh — izoh o'sha yerda.
// Rasm mobil galereyadan expo-image-picker orqali tanlanadi, FormData bilan
// yuklanadi. Ko'rsatishda esa PRIVATE (autentifikatsiyalangan) route bo'lgani
// uchun oddiy <Image source={{uri}}> yetarli emas — Bearer token'ni
// `headers`ga qo'shib berish kerak (RN Image shuni qo'llab-quvvatlaydi).
import { useEffect, useState } from "react";
import { View, Text, Pressable, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { PregnancyAlbumPhoto } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api, baseUrl } from "@/lib/api";
import { getToken } from "@/lib/storage";
import { Button, Card, TextField } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

export function PregnancyAlbum({ currentWeek }: { currentWeek: number }) {
  const { dict } = useI18n();
  const [photos, setPhotos] = useState<PregnancyAlbumPhoto[] | null>(null);
  const [authHeader, setAuthHeader] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<{ uri: string } | null>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.pregnancy.album.list().then((res) => setPhotos(res.photos));
    getToken().then((t) => setAuthHeader(t ? { Authorization: `Bearer ${t}` } : {}));
  }, []);

  async function pick() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setPending({ uri: result.assets[0].uri });
  }

  async function confirmUpload() {
    if (!pending) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      // React Native'ning FormData'si shu {uri, name, type} shaklini
      // maxsus qo'llab-quvvatlaydi (Blob emas — fayl tizimidan to'g'ridan-to'g'ri oqim).
      form.append("photo", { uri: pending.uri, name: "photo.jpg", type: "image/jpeg" } as unknown as Blob);
      form.append("pregnancyWeek", String(currentWeek));
      if (note.trim()) form.append("note", note.trim());
      const res = await api.pregnancy.album.upload(form);
      setPhotos((cur) => [res.photo, ...(cur ?? [])]);
      setPending(null);
      setNote("");
    } catch {
      setError(dict.pregnancy.albumUploadError);
    } finally {
      setUploading(false);
    }
  }

  function remove(id: string) {
    Alert.alert(dict.pregnancy.albumDeleteConfirm, "", [
      { text: dict.common.cancel, style: "cancel" },
      {
        text: dict.common.delete,
        style: "destructive",
        onPress: () => {
          setPhotos((cur) => (cur ?? []).filter((p) => p.id !== id));
          api.pregnancy.album.remove(id).catch(() => {});
        },
      },
    ]);
  }

  return (
    <Card className="gap-4">
      <View>
        <Text className="text-base font-bold text-text-primary">{dict.pregnancy.albumTitle}</Text>
        <Text className="text-xs text-text-secondary">{dict.pregnancy.albumSubtitle}</Text>
      </View>

      {pending ? (
        <View className="gap-3 rounded-2xl bg-surface-muted p-4">
          <Image source={{ uri: pending.uri }} className="mx-auto h-40 w-40 rounded-2xl" />
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-text-secondary">{dict.pregnancy.albumNoteLabel}</Text>
            <TextField value={note} onChangeText={setNote} placeholder={dict.pregnancy.albumNotePlaceholder} />
          </View>
          <View className="flex-row gap-2">
            <Button variant="ghost" onPress={() => setPending(null)} disabled={uploading}>
              {dict.common.cancel}
            </Button>
            <View className="flex-1">
              <Button onPress={confirmUpload} disabled={uploading}>
                {uploading ? dict.pregnancy.albumUploading : dict.common.save}
              </Button>
            </View>
          </View>
        </View>
      ) : (
        <Button variant="secondary" onPress={pick}>
          <View className="flex-row items-center gap-2">
            <Emoji e="📷" size={16} />
            <Text className="font-semibold text-text-primary">{dict.pregnancy.albumAddButton}</Text>
          </View>
        </Button>
      )}

      {error && <Text className="text-sm font-medium text-danger">{error}</Text>}

      {photos === null ? null : photos.length === 0 ? (
        <Text className="py-2 text-center text-sm text-text-muted">{dict.pregnancy.albumEmpty}</Text>
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {photos.map((p) => (
            <View key={p.id} style={{ width: "31%" }} className="overflow-hidden rounded-[20px] border-2 border-primary/25">
              <Image source={{ uri: `${baseUrl}${p.photoUrl}`, headers: authHeader }} className="aspect-square w-full" />
              <View className="absolute inset-x-0 bottom-0 px-1.5 pb-1.5 pt-4">
                <View className="self-start rounded-full bg-white/90 px-2 py-0.5">
                  <Text className="text-[9px] font-bold text-primary">
                    {p.pregnancyWeek ? dict.pregnancy.albumWeekBadge(p.pregnancyWeek) : dict.pregnancy.albumNoWeek}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => remove(p.id)} className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/40">
                <Text className="text-xs text-white">×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
