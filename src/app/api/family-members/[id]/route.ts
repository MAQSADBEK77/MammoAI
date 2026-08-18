import { NextResponse } from "next/server";
import { deleteFamilyMember } from "@/server/db";
import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    deleteFamilyMember(id, user.id); // scoped to the owner — can't touch someone else's
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
