"use client";

// Homiladorlik albomi — foydalanuvchi o'zi yuklagan qorin/chaqaloq rasmlari,
// "bezakli frame" bilan (foydalanuvchi so'rovi: "o'zi ramlar yuklash" →
// aniqlashtirilgan: Instagram story frame kabi, "N-hafta" matni bilan bezak).
// MUHIM: frame rasmning o'ziga PISHIRILMAGAN — shu komponentda CSS orqali
// chiziladi (server/repo.ts#pregnancy_album_photos izohiga qarang) — dizayn
// keyin o'zgarsa, hech qanday qayta yuklash kerak emas.
//
// Rasmning o'zi Vercel Blob'da (private) — bu yerdagi <img src> har doim
// bizning proksi route'imizga (`/api/pregnancy/album/:id/photo`) ishora
// qiladi, brauzer cookie orqali avtomatik autentifikatsiyadan o'tadi (web
// sessiyasi httpOnly cookie).

import { useEffect, useRef, useState } from "react";
import type { PregnancyAlbumPhoto } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Card, Button } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

export function PregnancyAlbum({ currentWeek }: { currentWeek: number }) {
  const { dict } = useI18n();
  const [photos, setPhotos] = useState<PregnancyAlbumPhoto[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.pregnancy.album.list().then((res) => setPhotos(res.photos));
  }, []);

  function pickFile() {
    fileInputRef.current?.click();
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // xuddi shu faylni qayta tanlasa ham onChange ishga tushishi uchun
    if (!file) return;
    // `accept` atributi ba'zi qurilmalarda (ayniqsa mobil brauzer) video
    // tanlashni to'liq bloklamaydi — foydalanuvchi buni real qurilmada
    // ko'rsatgan (video tanlab, keyin serverda noaniq xatolik ko'rgan).
    // Shuning uchun bu yerda ANIQ tekshiruv — darhol, tarmoqqa yubormasdan.
    if (!file.type.startsWith("image/")) {
      setError(dict.pregnancy.albumInvalidFormat);
      return;
    }
    setError(null);
    setPendingFile(file);
  }

  async function confirmUpload() {
    if (!pendingFile) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("photo", pendingFile);
      form.set("pregnancyWeek", String(currentWeek));
      if (note.trim()) form.set("note", note.trim());
      const res = await api.pregnancy.album.upload(form);
      setPhotos((cur) => [res.photo, ...(cur ?? [])]);
      setPendingFile(null);
      setNote("");
    } catch {
      setError(dict.pregnancy.albumUploadError);
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(dict.pregnancy.albumDeleteConfirm)) return;
    setPhotos((cur) => (cur ?? []).filter((p) => p.id !== id));
    await api.pregnancy.album.remove(id).catch(() => {});
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-text-primary">{dict.pregnancy.albumTitle}</h2>
        <p className="text-xs text-text-secondary">{dict.pregnancy.albumSubtitle}</p>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />

      {pendingFile ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-surface-muted p-4">
          <img src={URL.createObjectURL(pendingFile)} alt="" className="mx-auto h-40 w-40 rounded-2xl object-cover" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">{dict.pregnancy.albumNoteLabel}</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={dict.pregnancy.albumNotePlaceholder}
              className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setPendingFile(null)} disabled={uploading}>
              {dict.common.cancel}
            </Button>
            <div className="flex-1">
              <Button onClick={confirmUpload} disabled={uploading}>
                {uploading ? dict.pregnancy.albumUploading : dict.common.save}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={pickFile} className="gap-2">
          <Emoji e="📷" size={16} />
          {dict.pregnancy.albumAddButton}
        </Button>
      )}

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      {photos === null ? null : photos.length === 0 ? (
        <p className="py-2 text-center text-sm text-text-muted">{dict.pregnancy.albumEmpty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-[20px] border-2 border-primary/25 shadow-sm">
              <img src={p.photoUrl} alt="" className="aspect-square w-full object-cover" />
              {/* Bezakli "frame" — Instagram story naqshi, gradient pastki bant + hafta yorlig'i. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/55 to-transparent px-2.5 pb-2 pt-6">
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {p.pregnancyWeek ? dict.pregnancy.albumWeekBadge(p.pregnancyWeek) : dict.pregnancy.albumNoWeek}
                </span>
              </div>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100"
                aria-label={dict.common.cancel}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
