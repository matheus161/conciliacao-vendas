import { db } from "@/lib/db";

export type MemberRole = "admin" | "operator" | "support";

export async function getMembershipRole(userId: string, groupId: string): Promise<MemberRole | null> {
  const membership = await db.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  return (membership?.role as MemberRole) ?? null;
}

export type MemberSummary = { id: string; email: string; role: MemberRole };

export async function listMembers(groupId: string): Promise<MemberSummary[]> {
  const memberships = await db.membership.findMany({
    where: { groupId },
    include: { user: true },
  });
  return memberships.map((m) => ({ id: m.id, email: m.user.email, role: m.role as MemberRole }));
}

export type InviteInput = { email: string; role: MemberRole };
export type InviteResult = { id: string; email: string; role: MemberRole };

export async function inviteMember(groupId: string, input: InviteInput): Promise<InviteResult> {
  const pending = await db.pendingMembership.create({
    data: { groupId, email: input.email, role: input.role },
  });
  return { id: pending.id, email: pending.email, role: pending.role as MemberRole };
}

export type InvitePreview = { email: string; role: MemberRole; groupName: string };

export async function getInvitePreview(id: string): Promise<InvitePreview | null> {
  const pending = await db.pendingMembership.findUnique({
    where: { id },
    include: { group: true },
  });
  if (!pending) return null;
  return { email: pending.email, role: pending.role as MemberRole, groupName: pending.group.name };
}
