import { NextResponse } from "next/server";
import { getMembershipRole, type MemberRole } from "@/server/services/membershipService";

export async function requireRole(
  userId: string,
  groupId: string,
  role?: MemberRole
): Promise<NextResponse | null> {
  const actualRole = await getMembershipRole(userId, groupId);
  if (!actualRole) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (role && actualRole !== role) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  return null;
}
