import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getMembershipRole, inviteMember } from "@/server/services/membershipService";

const inviteSchema = z.object({
  groupId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["operator", "support"]),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const role = await getMembershipRole(session.userId, parsed.data.groupId);
  if (role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const invite = await inviteMember(parsed.data.groupId, { email: parsed.data.email, role: parsed.data.role });
  return NextResponse.json(invite, { status: 201 });
}
