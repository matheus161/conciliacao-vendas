import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../../tests/helpers/resetDb";
import { POST as signupPOST } from "../signup/route";
import { POST } from "./route";

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await resetDb();
    await signupPOST(
      jsonRequest("http://localhost/api/auth/signup", {
        email: "admin@franquia.com",
        password: "supersecret1",
        groupName: "Franquia Norte",
      })
    );
  });

  it("logs in with correct credentials and sets a session cookie", async () => {
    const res = await POST(
      jsonRequest("http://localhost/api/auth/login", { email: "admin@franquia.com", password: "supersecret1" })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("session=");
  });

  it("rejects a wrong password with 401", async () => {
    const res = await POST(
      jsonRequest("http://localhost/api/auth/login", { email: "admin@franquia.com", password: "wrong-password" })
    );
    expect(res.status).toBe(401);
  });
});
