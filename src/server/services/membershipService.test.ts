import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { resetDb } from "../../../tests/helpers/resetDb";
import { signup, acceptInvite } from "./authService";
import { createStore } from "./groupService";
import {
  getMembershipRole,
  listMembers,
  inviteMember,
  getInvitePreview,
  getAccessibleStoreIds,
} from "./membershipService";

describe("membershipService", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns the role for an existing membership and null otherwise", async () => {
    const { userId, groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    expect(await getMembershipRole(userId, groupId)).toBe("admin");
    expect(await getMembershipRole("nonexistent", groupId)).toBeNull();
  });

  it("lists members of a group", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const members = await listMembers(groupId);
    expect(members).toEqual([
      expect.objectContaining({ email: "admin@franquia.com", role: "admin" }),
    ]);
  });

  it("creates a pending membership and previews it", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });
    const preview = await getInvitePreview(invite.id);

    expect(preview).toEqual({
      email: "operador@franquia.com",
      role: "operator",
      groupName: "Franquia Norte",
      hasAccount: false,
    });
  });

  it("previews hasAccount true when the invited e-mail already has an account", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    await signup({
      email: "operador@franquia.com",
      password: "outrasenha1",
      groupName: "Outra Franquia",
    });

    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });
    const preview = await getInvitePreview(invite.id);

    expect(preview?.hasAccount).toBe(true);
  });

  it("sets an expiry a week out when creating an invite", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const before = Date.now();
    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });
    const pending = await db.pendingMembership.findUniqueOrThrow({ where: { id: invite.id } });

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(pending.expiresAt.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 5000);
    expect(pending.expiresAt.getTime()).toBeLessThanOrEqual(before + sevenDaysMs + 5000);
  });

  it("returns null preview for an unknown invite id", async () => {
    expect(await getInvitePreview("does-not-exist")).toBeNull();
  });

  it("returns null preview for an expired invite", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });
    await db.pendingMembership.update({
      where: { id: invite.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await getInvitePreview(invite.id)).toBeNull();
  });
});

describe("getAccessibleStoreIds", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns 'all' for the admin, ignoring any store assignment rows", async () => {
    const { userId, groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const store = await createStore(groupId, { name: "Loja Centro", code: "CTR", city: "Belém, PA" });
    const membership = await db.membership.findUniqueOrThrow({
      where: { userId_groupId: { userId, groupId } },
    });
    await db.membershipStore.create({ data: { membershipId: membership.id, storeId: store.id } });

    expect(await getAccessibleStoreIds(userId, groupId)).toBe("all");
  });

  it("returns 'all' for a member with no store assignment rows", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });
    const { userId } = await acceptInvite({ pendingMembershipId: invite.id, password: "outrasenha123" });

    expect(await getAccessibleStoreIds(userId, groupId)).toBe("all");
  });

  it("returns only the assigned store ids for a restricted member", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const storeA = await createStore(groupId, { name: "Loja A", code: "A1", city: "Belém, PA" });
    await createStore(groupId, { name: "Loja B", code: "B1", city: "Belém, PA" });

    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });
    const { userId } = await acceptInvite({ pendingMembershipId: invite.id, password: "outrasenha123" });
    const membership = await db.membership.findUniqueOrThrow({
      where: { userId_groupId: { userId, groupId } },
    });
    await db.membershipStore.create({ data: { membershipId: membership.id, storeId: storeA.id } });

    expect(await getAccessibleStoreIds(userId, groupId)).toEqual([storeA.id]);
  });

  it("returns an empty array for a user with no membership in the group", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    expect(await getAccessibleStoreIds("nonexistent-user", groupId)).toEqual([]);
  });
});
