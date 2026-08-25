import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { acceptInvite, AuthError } from "@/server/services/authService";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const acceptSchema = z.object({ password: z.string().min(8) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  try {
    const result = await acceptInvite({ pendingMembershipId: params.id, password: parsed.data.password });
    const user = await db.user.findUniqueOrThrow({ where: { id: result.userId } });
    const token = await createSessionToken({ userId: result.userId, email: user.email });
    const response = NextResponse.json({ groupId: result.groupId, role: result.role }, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err) {
    if (err instanceof AuthError && err.code === "INVITE_NOT_FOUND") {
      return NextResponse.json({ error: "INVITE_NOT_FOUND" }, { status: 404 });
    }
    throw err;
  }
}
