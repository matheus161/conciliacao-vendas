import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../../../tests/helpers/resetDb";
import { signup, acceptInvite } from "@/server/services/authService";
import { inviteMember } from "@/server/services/membershipService";
import { createStore, deactivateStore, listStores } from "@/server/services/groupService";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { POST } from "./route";

async function authedPost(userId: string) {
  const token = await createSessionToken({ userId, email: "admin@franquia.com" });
  return new NextRequest("http://localhost/api/stores/x/activate", {
    method: "POST",
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
  });
}

describe("POST /api/stores/[id]/activate", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("lets an admin reactivate a deactivated store in their group", async () => {
    const { userId, groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const store = await createStore(groupId, { name: "Loja Centro", code: "CTR", city: "Belém, PA" });
    await deactivateStore(groupId, store.id);

    const res = await POST(await authedPost(userId), { params: { id: store.id } });

    expect(res.status).toBe(200);
    expect(await listStores(groupId)).toEqual([expect.objectContaining({ id: store.id, active: true })]);
  });

  it("rejects a non-admin with 403", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const store = await createStore(groupId, { name: "Loja Centro", code: "CTR", city: "Belém, PA" });
    await deactivateStore(groupId, store.id);
    const invite = await inviteMember(groupId, { email: "op@franquia.com", role: "operator" });
    const { userId: operatorId } = await acceptInvite({
      pendingMembershipId: invite.id,
      password: "outrasenha123",
    });

    const res = await POST(await authedPost(operatorId), { params: { id: store.id } });

    expect(res.status).toBe(403);
    expect(await listStores(groupId, "all", true)).toEqual([
      expect.objectContaining({ id: store.id, active: false }),
    ]);
  });

  it("rejects an unauthenticated request with 401", async () => {
    const req = new NextRequest("http://localhost/api/stores/x/activate", { method: "POST" });
    const res = await POST(req, { params: { id: "x" } });
    expect(res.status).toBe(401);
  });

  it("returns 404 for a store id that does not exist", async () => {
    const { userId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const res = await POST(await authedPost(userId), { params: { id: "does-not-exist" } });

    expect(res.status).toBe(404);
  });
});
