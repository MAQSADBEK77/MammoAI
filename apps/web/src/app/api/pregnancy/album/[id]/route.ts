import { NextResponse, type NextRequest } from "next/server";
import { del } from "@vercel/blob";
import { jsonError, requireUser } from "@/server/api-utils";
import { deletePregnancyAlbumPhoto } from "@/server/repo";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const blobPathname = await deletePregnancyAlbumPhoto(user.id, id);
    if (blobPathname) {
      // Bazadagi yozuv o'chdi — fayl ham Blob'da abadiy qolib ketmasin.
      // Xato bo'lsa ham (masalan fayl allaqachon yo'q) javobga ta'sir qilmaydi.
      await del(blobPathname).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
