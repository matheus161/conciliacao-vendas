import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { deactivateStore } from "@/server/services/groupService";

export const POST = withAuth<{ params: { id: string } }>(async (_req, session, { params }) => {
  const store = await db.store.findUnique({ where: { id: params.id } });
  if (!store) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const forbidden = await requireRole(session.userId, store.groupId, "admin");
  if (forbidden) return forbidden;

  await deactivateStore(store.groupId, store.id);
  return NextResponse.json({ ok: true }, { status: 200 });
});
