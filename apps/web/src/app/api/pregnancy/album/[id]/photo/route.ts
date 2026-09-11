import { NextResponse, type NextRequest } from "next/server";
import { get } from "@vercel/blob";
import { jsonError, requireUser, ApiError } from "@/server/api-utils";
import { getPregnancyAlbumPhoto } from "@/server/repo";

/** Private Blob proksi — Vercel'ning tavsiya etilgan naqshi (private-storage
 * hujjati): auth shu route'ning O'ZIDA tekshiriladi (middleware'ga
 * ishonilmaydi), keyin `get()` orqali oqim to'g'ridan-to'g'ri javobga
 * uzatiladi. Boshqa foydalanuvchining rasmini so'rab bo'lmaydi — egalik
 * `getPregnancyAlbumPhoto(userId, id)` orqali tekshiriladi. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const entry = await getPregnancyAlbumPhoto(user.id, id);
    if (!entry) throw new ApiError(404, "Rasm topilmadi");

    const result = await get(entry.blobPathname, { access: "private" });
    if (!result || result.statusCode !== 200) throw new ApiError(404, "Rasm topilmadi");

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
