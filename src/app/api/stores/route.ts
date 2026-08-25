import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getMembershipRole } from "@/server/services/membershipService";
import { createStore, listStores } from "@/server/services/groupService";

const createStoreSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const groupId = req.nextUrl.searchParams.get("groupId");
  if (!groupId) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const role = await getMembershipRole(session.userId, groupId);
  if (!role) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const stores = await listStores(groupId);
  return NextResponse.json(stores, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json();
  const parsed = createStoreSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const role = await getMembershipRole(session.userId, parsed.data.groupId);
  if (role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const store = await createStore(parsed.data.groupId, { name: parsed.data.name, code: parsed.data.code });
  return NextResponse.json(store, { status: 201 });
}
