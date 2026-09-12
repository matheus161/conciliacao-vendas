import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import {
  createSessionToken,
  verifySessionToken,
  getSessionFromRequest,
  SESSION_COOKIE_NAME,
} from "./session";

beforeAll(() => {
  process.env.SESSION_JWT_SECRET = "test-secret-at-least-32-bytes-long!!";
});

describe("session", () => {
  it("round-trips a valid payload", async () => {
    const token = await createSessionToken({ userId: "user_1", email: "a@b.com" });
    expect(await verifySessionToken(token)).toEqual({ userId: "user_1", email: "a@b.com" });
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken({ userId: "user_1", email: "a@b.com" });
    const tampered = token.slice(0, -2) + "xx";
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("reads a valid session from the request cookie", async () => {
    const token = await createSessionToken({ userId: "user_1", email: "a@b.com" });
    const req = new NextRequest("http://localhost/dashboard", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    expect(await getSessionFromRequest(req)).toEqual({ userId: "user_1", email: "a@b.com" });
  });

  it("returns null when there is no cookie", async () => {
    const req = new NextRequest("http://localhost/dashboard");
    expect(await getSessionFromRequest(req)).toBeNull();
  });
});
