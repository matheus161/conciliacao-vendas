import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/withAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { createStore, listStores } from "@/server/services/groupService";
import { getAccessibleStoreIds } from "@/server/services/membershipService";

const createStoreSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(1),
  city: z.string().min(1),
});

export const GET = withAuth(async (req, session) => {
  const groupId = req.nextUrl.searchParams.get("groupId");
  if (!groupId) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const forbidden = await requireRole(session.userId, groupId);
  if (forbidden) return forbidden;

  const accessible = await getAccessibleStoreIds(session.userId, groupId);
  const stores = await listStores(groupId, accessible);
  return NextResponse.json(stores, { status: 200 });
});

export const POST = withAuth(async (req, session) => {
  const body = await req.json();
  const parsed = createStoreSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const forbidden = await requireRole(session.userId, parsed.data.groupId, "admin");
  if (forbidden) return forbidden;

  const store = await createStore(parsed.data.groupId, {
    name: parsed.data.name,
    code: parsed.data.code,
    city: parsed.data.city,
  });
  return NextResponse.json(store, { status: 201 });
});
