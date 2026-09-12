import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME } from "./session";
import { withAuth } from "./withAuth";

beforeAll(() => {
  process.env.SESSION_JWT_SECRET = "test-secret-at-least-32-bytes-long!!";
});

describe("withAuth", () => {
  it("calls the handler with the session when authenticated", async () => {
    const token = await createSessionToken({ userId: "user_1", email: "a@b.com" });
    const req = new NextRequest("http://localhost/api/whatever", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });

    const handler = withAuth(async (_req, session) => {
      return NextResponse.json({ userId: session.userId }, { status: 200 });
    });

    const res = await handler(req, undefined);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: "user_1" });
  });

  it("returns 401 without calling the handler when there is no session", async () => {
    const req = new NextRequest("http://localhost/api/whatever");
    let called = false;

    const handler = withAuth(async (_req, _session) => {
      called = true;
      return NextResponse.json({ ok: true }, { status: 200 });
    });

    const res = await handler(req, undefined);
    expect(res.status).toBe(401);
    expect(called).toBe(false);
  });
});
