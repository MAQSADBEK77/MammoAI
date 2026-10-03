import { NextResponse, type NextRequest } from "next/server";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import {
  confirmDoctorVisit,
  hasConfirmedDoctorVisit,
  listDoctors,
  rateDoctor,
  recordDoctorVisitIntent,
} from "@/server/repo";

/** DOC-01: shifokorlar ro'yxati. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const specialty = request.nextUrl.searchParams.get("specialty") ?? undefined;
    return NextResponse.json({ doctors: await listDoctors(user.id, specialty || undefined) });
  } catch (error) {
    return jsonError(error);
  }
}

interface ActionBody {
  doctorId?: string;
  action?: "visit" | "confirm" | "rate";
  rating?: number;
  comment?: string;
}

/**
 * Tashrif va baho.
 *
 * MUHIM: baho faqat TASDIQLANGAN tashrifdan keyin qabul qilinadi va bu
 * SERVERDA tekshiriladi. Mijozga ishonib bo'lmaydi — aks holda reytingni
 * bitta so'rov bilan sotib olish mumkin bo'lardi.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as ActionBody;
    const doctorId = typeof body.doctorId === "string" ? body.doctorId : "";
    if (!doctorId) throw new ApiError(400, "Shifokor tanlanmagan");

    if (body.action === "visit") {
      await recordDoctorVisitIntent(user.id, doctorId);
    } else if (body.action === "confirm") {
      await confirmDoctorVisit(user.id, doctorId);
    } else if (body.action === "rate") {
      const rating = Math.round(Number(body.rating));
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new ApiError(400, "Baho 1 dan 5 gacha bo'lishi kerak");
      if (!(await hasConfirmedDoctorVisit(user.id, doctorId))) {
        throw new ApiError(403, "Baho faqat tashrifdan keyin qoldiriladi");
      }
      const comment = typeof body.comment === "string" && body.comment.trim() ? body.comment.trim().slice(0, 500) : null;
      await rateDoctor(user.id, doctorId, rating, comment);
    } else {
      throw new ApiError(400, "Noma'lum amal");
    }

    return NextResponse.json({ doctors: await listDoctors(user.id) });
  } catch (error) {
    return jsonError(error);
  }
}
