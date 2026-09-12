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

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function inviteMember(groupId: string, input: InviteInput): Promise<InviteResult> {
  const pending = await db.pendingMembership.create({
    data: {
      groupId,
      email: input.email,
      role: input.role,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  return { id: pending.id, email: pending.email, role: pending.role as MemberRole };
}

export type InvitePreview = { email: string; role: MemberRole; groupName: string; hasAccount: boolean };

export async function getInvitePreview(id: string): Promise<InvitePreview | null> {
  const pending = await db.pendingMembership.findUnique({
    where: { id },
    include: { group: true },
  });
  if (!pending) return null;
  if (pending.expiresAt < new Date()) return null;

  const existingUser = await db.user.findUnique({ where: { email: pending.email }, select: { id: true } });
  return {
    email: pending.email,
    role: pending.role as MemberRole,
    groupName: pending.group.name,
    hasAccount: !!existingUser,
  };
}

/**
 * Which stores a member can see within the group. "all" means unrestricted (the default —
 * no MembershipStore rows for the membership) or the admin role, which is never restricted.
 */
export async function getAccessibleStoreIds(userId: string, groupId: string): Promise<string[] | "all"> {
  const membership = await db.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (!membership) return [];
  if (membership.role === "admin") return "all";

  const assignments = await db.membershipStore.findMany({
    where: { membershipId: membership.id },
    select: { storeId: true },
  });
  return assignments.length === 0 ? "all" : assignments.map((a) => a.storeId);
}
