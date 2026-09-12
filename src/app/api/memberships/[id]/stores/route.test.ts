import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../../../tests/helpers/resetDb";
import { signup, acceptInvite } from "@/server/services/authService";
import { inviteMember, getStoreAssignmentIds } from "@/server/services/membershipService";
import { createStore } from "@/server/services/groupService";
import { db } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { PUT } from "./route";

async function authedPut(userId: string, membershipId: string, storeIds: string[]) {
  const token = await createSessionToken({ userId, email: "admin@franquia.com" });
  return new NextRequest(`http://localhost/api/memberships/${membershipId}/stores`, {
    method: "PUT",
    headers: { "content-type": "application/json", cookie: `${SESSION_COOKIE_NAME}=${token}` },
    body: JSON.stringify({ storeIds }),
  });
}

describe("PUT /api/memberships/[id]/stores", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("lets an admin set store assignments for a member of their group", async () => {
    const { userId: adminId, groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const store = await createStore(groupId, { name: "Loja Centro", code: "CTR", city: "Belém, PA" });
    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });
    const { userId: operatorId } = await acceptInvite({ pendingMembershipId: invite.id, password: "outrasenha123" });
    const membership = await db.membership.findUniqueOrThrow({
      where: { userId_groupId: { userId: operatorId, groupId } },
    });

    const res = await PUT(await authedPut(adminId, membership.id, [store.id]), { params: { id: membership.id } });

    expect(res.status).toBe(200);
    expect(await getStoreAssignmentIds(membership.id)).toEqual([store.id]);
  });

  it("rejects a non-admin with 403", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });
    const { userId: operatorId } = await acceptInvite({ pendingMembershipId: invite.id, password: "outrasenha123" });
    const membership = await db.membership.findUniqueOrThrow({
      where: { userId_groupId: { userId: operatorId, groupId } },
    });

    const res = await PUT(await authedPut(operatorId, membership.id, []), { params: { id: membership.id } });

    expect(res.status).toBe(403);
  });

  it("rejects a store id that does not belong to the membership's group", async () => {
    const { userId: adminId, groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const outro = await signup({ email: "outro-admin@x.com", password: "supersecret1", groupName: "Outra" });
    const outraLoja = await createStore(outro.groupId, { name: "Loja Fora", code: "FORA", city: "SP" });

    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });
    const { userId: operatorId } = await acceptInvite({ pendingMembershipId: invite.id, password: "outrasenha123" });
    const membership = await db.membership.findUniqueOrThrow({
      where: { userId_groupId: { userId: operatorId, groupId } },
    });

    const res = await PUT(await authedPut(adminId, membership.id, [outraLoja.id]), {
      params: { id: membership.id },
    });

    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown membership", async () => {
    const { userId: adminId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const res = await PUT(await authedPut(adminId, "does-not-exist", []), { params: { id: "does-not-exist" } });

    expect(res.status).toBe(404);
  });
});
