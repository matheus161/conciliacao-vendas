import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../../../tests/helpers/resetDb";
import { signup } from "@/server/services/authService";
import { inviteMember } from "@/server/services/membershipService";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { POST } from "./route";

async function authedRequest(inviteId: string, userId: string, email: string) {
  const token = await createSessionToken({ userId, email });
  return new NextRequest(`http://localhost/api/invites/${inviteId}/join`, {
    method: "POST",
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
  });
}

describe("POST /api/invites/[id]/join", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("attaches the invite to the currently authenticated matching user", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const { userId } = await signup({
      email: "op@franquia.com",
      password: "senha-original1",
      groupName: "Outra",
    });
    const invite = await inviteMember(groupId, { email: "op@franquia.com", role: "operator" });

    const res = await POST(await authedRequest(invite.id, userId, "op@franquia.com"), {
      params: { id: invite.id },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ groupId, role: "operator" });
  });

  it("rejects an unauthenticated request with 401", async () => {
    const req = new NextRequest("http://localhost/api/invites/whatever/join", { method: "POST" });
    const res = await POST(req, { params: { id: "whatever" } });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the invite does not belong to the authenticated user", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const { userId: outroUserId } = await signup({
      email: "outra-pessoa@franquia.com",
      password: "senha-original1",
      groupName: "Outra",
    });
    const invite = await inviteMember(groupId, { email: "op@franquia.com", role: "operator" });

    const res = await POST(await authedRequest(invite.id, outroUserId, "outra-pessoa@franquia.com"), {
      params: { id: invite.id },
    });

    expect(res.status).toBe(404);
  });
});
