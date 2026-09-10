import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, type SessionPayload } from "./session";

type AuthedHandler<Ctx> = (
  req: NextRequest,
  session: SessionPayload,
  ctx: Ctx
) => Promise<Response> | Response;

export function withAuth<Ctx = unknown>(handler: AuthedHandler<Ctx>) {
  return async (req: NextRequest, ctx?: Ctx) => {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    return handler(req, session, ctx as Ctx);
  };
}
