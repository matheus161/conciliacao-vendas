import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../tests/helpers/resetDb";
import { signup } from "@/server/services/authService";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { POST } from "./route";

async function authedRequest(userId: string, body: unknown) {
  const token = await createSessionToken({ userId, email: "admin@franquia.com" });
  return new NextRequest("http://localhost/api/invites", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `${SESSION_COOKIE_NAME}=${token}` },
    body: JSON.stringify(body),
  });
}

describe("POST /api/invites", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("lets an admin create an invite", async () => {
    const { userId, groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const res = await POST(await authedRequest(userId, { groupId, email: "op@franquia.com", role: "operator" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.email).toBe("op@franquia.com");
  });

  it("rejects an unauthenticated request with 401", async () => {
    const req = new NextRequest("http://localhost/api/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ groupId: "g1", email: "op@franquia.com", role: "operator" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
