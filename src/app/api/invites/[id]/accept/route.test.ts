import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../../../tests/helpers/resetDb";
import { signup } from "@/server/services/authService";
import { inviteMember } from "@/server/services/membershipService";
import { POST } from "./route";

describe("POST /api/invites/[id]/accept", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("accepts a valid invite and sets a session cookie", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const invite = await inviteMember(groupId, { email: "op@franquia.com", role: "operator" });

    const req = new NextRequest(`http://localhost/api/invites/${invite.id}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "outrasenha1" }),
    });
    const res = await POST(req, { params: { id: invite.id } });

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("session=");
  });

  it("returns 404 for an unknown invite", async () => {
    const req = new NextRequest("http://localhost/api/invites/does-not-exist/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "outrasenha1" }),
    });
    const res = await POST(req, { params: { id: "does-not-exist" } });
    expect(res.status).toBe(404);
  });
});
