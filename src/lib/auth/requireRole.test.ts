import { describe, it, expect, beforeEach } from "vitest";
import { signup } from "@/server/services/authService";
import { acceptInvite } from "@/server/services/authService";
import { inviteMember } from "@/server/services/membershipService";
import { resetDb } from "../../../tests/helpers/resetDb";
import { requireRole } from "./requireRole";

describe("requireRole", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns null when the user has the required role", async () => {
    const { userId, groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    expect(await requireRole(userId, groupId, "admin")).toBeNull();
  });

  it("returns null when any membership is enough and the user is a member", async () => {
    const { userId, groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    expect(await requireRole(userId, groupId)).toBeNull();
  });

  it("returns a 403 response when the user's role does not match the required one", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });
    const { userId } = await acceptInvite({ pendingMembershipId: invite.id, password: "outrasenha1" });

    const res = await requireRole(userId, groupId, "admin");
    expect(res?.status).toBe(403);
  });

  it("returns a 403 response when the user is not a member of the group", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const res = await requireRole("nonexistent-user", groupId);
    expect(res?.status).toBe(403);
  });
});
