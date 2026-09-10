import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { resetDb } from "../../../tests/helpers/resetDb";
import { signup } from "./authService";

describe("authService.signup", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a user, a group, and an admin membership", async () => {
    const result = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const membership = await db.membership.findUnique({
      where: { userId_groupId: { userId: result.userId, groupId: result.groupId } },
    });
    expect(membership?.role).toBe("admin");

    const group = await db.group.findUnique({ where: { id: result.groupId } });
    expect(group?.name).toBe("Franquia Norte");
  });

  it("throws EMAIL_TAKEN for a duplicate email", async () => {
    await signup({ email: "admin@franquia.com", password: "supersecret1", groupName: "Franquia Norte" });

    await expect(
      signup({ email: "admin@franquia.com", password: "another1234", groupName: "Outra Franquia" })
    ).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
  });
});

import { login } from "./authService";

describe("authService.login", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns the user for correct credentials", async () => {
    await signup({ email: "admin@franquia.com", password: "supersecret1", groupName: "Franquia Norte" });

    const result = await login({ email: "admin@franquia.com", password: "supersecret1" });
    expect(result.email).toBe("admin@franquia.com");
  });

  it("throws INVALID_CREDENTIALS for a wrong password", async () => {
    await signup({ email: "admin@franquia.com", password: "supersecret1", groupName: "Franquia Norte" });

    await expect(
      login({ email: "admin@franquia.com", password: "wrong-password" })
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("throws INVALID_CREDENTIALS for an unknown email", async () => {
    await expect(
      login({ email: "nobody@nowhere.com", password: "whatever1" })
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });
});

import { acceptInvite } from "./authService";
import { inviteMember } from "./membershipService";

describe("authService.acceptInvite", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a new user and attaches the invited role", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });

    const result = await acceptInvite({ pendingMembershipId: invite.id, password: "outrasenha1" });

    expect(result.groupId).toBe(groupId);
    expect(result.role).toBe("operator");

    const remaining = await db.pendingMembership.findUnique({ where: { id: invite.id } });
    expect(remaining).toBeNull();
  });

  it("throws INVITE_NOT_FOUND for an unknown invite", async () => {
    await expect(
      acceptInvite({ pendingMembershipId: "does-not-exist", password: "outrasenha1" })
    ).rejects.toMatchObject({ code: "INVITE_NOT_FOUND" });
  });

  it("throws INVITE_NOT_FOUND for an expired invite", async () => {
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

    await expect(
      acceptInvite({ pendingMembershipId: invite.id, password: "outrasenha1" })
    ).rejects.toMatchObject({ code: "INVITE_NOT_FOUND" });
  });

  it("throws ACCOUNT_EXISTS instead of silently attaching an existing account", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    await signup({
      email: "operador@franquia.com",
      password: "senha-original1",
      groupName: "Outra Franquia",
    });
    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });

    await expect(
      acceptInvite({ pendingMembershipId: invite.id, password: "senha-forcada-pelo-atacante" })
    ).rejects.toMatchObject({ code: "ACCOUNT_EXISTS" });

    const membership = await db.membership.findFirst({ where: { groupId, user: { email: "operador@franquia.com" } } });
    expect(membership).toBeNull();

    const stillPending = await db.pendingMembership.findUnique({ where: { id: invite.id } });
    expect(stillPending).not.toBeNull();
  });
});

import { acceptInviteForExistingUser } from "./authService";

describe("authService.acceptInviteForExistingUser", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("attaches the invited role to the already-authenticated matching user", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const { userId } = await signup({
      email: "operador@franquia.com",
      password: "senha-original1",
      groupName: "Outra Franquia",
    });
    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });

    const result = await acceptInviteForExistingUser({ pendingMembershipId: invite.id, userId });

    expect(result.groupId).toBe(groupId);
    expect(result.role).toBe("operator");

    const remaining = await db.pendingMembership.findUnique({ where: { id: invite.id } });
    expect(remaining).toBeNull();
  });

  it("throws INVITE_NOT_FOUND when the authenticated user's e-mail does not match the invite", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const { userId: outroUserId } = await signup({
      email: "outra-pessoa@franquia.com",
      password: "senha-original1",
      groupName: "Outra Franquia",
    });
    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });

    await expect(
      acceptInviteForExistingUser({ pendingMembershipId: invite.id, userId: outroUserId })
    ).rejects.toMatchObject({ code: "INVITE_NOT_FOUND" });
  });

  it("throws INVITE_NOT_FOUND for an unknown invite", async () => {
    const { userId } = await signup({
      email: "operador@franquia.com",
      password: "senha-original1",
      groupName: "Outra Franquia",
    });

    await expect(
      acceptInviteForExistingUser({ pendingMembershipId: "does-not-exist", userId })
    ).rejects.toMatchObject({ code: "INVITE_NOT_FOUND" });
  });
});
