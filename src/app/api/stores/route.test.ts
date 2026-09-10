import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../tests/helpers/resetDb";
import { signup } from "@/server/services/authService";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { GET, POST } from "./route";

async function authedGet(userId: string, groupId: string) {
  const token = await createSessionToken({ userId, email: "admin@franquia.com" });
  return new NextRequest(`http://localhost/api/stores?groupId=${groupId}`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
  });
}

async function authedPost(userId: string, body: unknown) {
  const token = await createSessionToken({ userId, email: "admin@franquia.com" });
  return new NextRequest("http://localhost/api/stores", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `${SESSION_COOKIE_NAME}=${token}` },
    body: JSON.stringify(body),
  });
}

describe("stores API", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates and lists a store for the caller's group", async () => {
    const { userId, groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const createRes = await POST(
      await authedPost(userId, { groupId, name: "Loja Centro", code: "CTR", city: "Belém, PA" })
    );
    expect(createRes.status).toBe(201);

    const listRes = await GET(await authedGet(userId, groupId));
    expect(listRes.status).toBe(200);
    const stores = await listRes.json();
    expect(stores).toEqual([{ id: expect.any(String), name: "Loja Centro", code: "CTR", city: "Belém, PA" }]);
  });

  it("rejects an unauthenticated request with 401", async () => {
    const req = new NextRequest("http://localhost/api/stores?groupId=g1");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
