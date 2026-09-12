import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const response = NextResponse.next();
  // Prevents the browser (and its back/forward cache) from serving an authenticated
  // page after the session ends — otherwise hitting "back" post-logout can show stale,
  // cached content instead of re-checking the session.
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
