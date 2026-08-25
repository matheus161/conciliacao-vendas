import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signup, AuthError } from "@/server/services/authService";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  groupName: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    const result = await signup(parsed.data);
    const token = await createSessionToken({ userId: result.userId, email: parsed.data.email });
    const response = NextResponse.json({ groupId: result.groupId }, { status: 201 });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err) {
    if (err instanceof AuthError && err.code === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    }
    throw err;
  }
}
