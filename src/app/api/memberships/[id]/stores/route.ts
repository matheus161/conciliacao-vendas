import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { setStoreAssignments } from "@/server/services/membershipService";

const bodySchema = z.object({ storeIds: z.array(z.string().min(1)) });

export const PUT = withAuth<{ params: { id: string } }>(async (req, session, { params }) => {
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const membership = await db.membership.findUnique({ where: { id: params.id } });
  if (!membership) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const forbidden = await requireRole(session.userId, membership.groupId, "admin");
  if (forbidden) return forbidden;

  if (parsed.data.storeIds.length > 0) {
    const validCount = await db.store.count({
      where: { id: { in: parsed.data.storeIds }, groupId: membership.groupId },
    });
    if (validCount !== parsed.data.storeIds.length) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
  }

  await setStoreAssignments(membership.id, parsed.data.storeIds);
  return NextResponse.json({ ok: true }, { status: 200 });
});
