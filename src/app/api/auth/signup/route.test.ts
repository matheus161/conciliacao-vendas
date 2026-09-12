import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../../tests/helpers/resetDb";
import { POST } from "./route";

function jsonRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a user and a group, and sets a session cookie", async () => {
    const res = await POST(
      jsonRequest({ email: "admin@franquia.com", password: "supersecret1", groupName: "Franquia Norte" })
    );
    expect(res.status).toBe(201);
    expect(res.headers.get("set-cookie")).toContain("session=");
  });

  it("rejects a duplicate email with 409", async () => {
    await POST(jsonRequest({ email: "admin@franquia.com", password: "supersecret1", groupName: "Franquia Norte" }));
    const res = await POST(jsonRequest({ email: "admin@franquia.com", password: "another1234", groupName: "Outra" }));
    expect(res.status).toBe(409);
  });

  it("rejects invalid input with 400", async () => {
    const res = await POST(jsonRequest({ email: "not-an-email", password: "short", groupName: "" }));
    expect(res.status).toBe(400);
  });
});
