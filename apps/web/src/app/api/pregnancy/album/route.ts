import { NextResponse, type NextRequest } from "next/server";
import { put } from "@vercel/blob";
import type { PregnancyAlbumPhoto } from "@mammoai/shared";
import { jsonError, requireUser, ApiError } from "@/server/api-utils";
import { addPregnancyAlbumPhoto, listPregnancyAlbumPhotos } from "@/server/repo";

const MAX_PHOTO_BYTES = 6 * 1024 * 1024; // 6MB — mijoz tomonida siqilgan rasm yetarlicha kichik bo'lishi kerak
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Homiladorlik albomi — foydalanuvchi o'zi yuklagan qorin/chaqaloq rasmlari.
 * Ro'yxat: rasmning o'zi emas, faqat metama'lumot + o'z proksi URL'imiz
 * (haqiqiy fayl Vercel Blob'da, private — hech qachon to'g'ridan-to'g'ri
 * ommaviy havola bo'lmaydi). */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const rows = await listPregnancyAlbumPhotos(user.id);
    const photos: PregnancyAlbumPhoto[] = rows.map((r) => ({
      id: r.id,
      pregnancyWeek: r.pregnancyWeek,
      photoUrl: `/api/pregnancy/album/${r.id}/photo`,
      note: r.note,
      createdAt: r.createdAt,
    }));
    return NextResponse.json({ photos });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const form = await request.formData();
    const file = form.get("photo");
    if (!(file instanceof File)) throw new ApiError(400, "Rasm topilmadi");
    if (!ALLOWED_TYPES.has(file.type)) throw new ApiError(400, "Faqat JPEG/PNG/WebP rasm qabul qilinadi");
    if (file.size > MAX_PHOTO_BYTES) throw new ApiError(400, "Rasm hajmi juda katta (6MB dan kichik bo'lishi kerak)");

    const weekRaw = form.get("pregnancyWeek");
    const pregnancyWeek = typeof weekRaw === "string" && weekRaw.trim() ? Math.min(42, Math.max(1, Math.round(Number(weekRaw)))) : null;
    const noteRaw = form.get("note");
    const note = typeof noteRaw === "string" && noteRaw.trim() ? noteRaw.trim().slice(0, 300) : null;

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const pathname = `pregnancy-album/${user.id}/${crypto.randomUUID()}.${ext}`;
    const blob = await put(pathname, file, { access: "private", contentType: file.type });

    const entry = await addPregnancyAlbumPhoto(user.id, { pregnancyWeek, blobPathname: blob.pathname, note });
    const photo: PregnancyAlbumPhoto = {
      id: entry.id,
      pregnancyWeek: entry.pregnancyWeek,
      photoUrl: `/api/pregnancy/album/${entry.id}/photo`,
      note: entry.note,
      createdAt: entry.createdAt,
    };
    return NextResponse.json({ photo });
  } catch (error) {
    return jsonError(error);
  }
}
