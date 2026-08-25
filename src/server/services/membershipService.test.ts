import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { resetDb } from "../../../tests/helpers/resetDb";
import { signup } from "./authService";
import {
  getMembershipRole,
  listMembers,
  inviteMember,
  getInvitePreview,
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
    });
  });

  it("returns null preview for an unknown invite id", async () => {
    expect(await getInvitePreview("does-not-exist")).toBeNull();
  });
});
