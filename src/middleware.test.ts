import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { middleware } from "./middleware";

beforeAll(() => {
  process.env.SESSION_JWT_SECRET = "test-secret-at-least-32-bytes-long!!";
});

describe("middleware", () => {
  it("redirects to /login when there is no session", async () => {
    const req = new NextRequest("http://localhost/dashboard");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("passes through when the session is valid", async () => {
    const token = await createSessionToken({ userId: "user_1", email: "a@b.com" });
    const req = new NextRequest("http://localhost/dashboard", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });
});
