import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/withAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { inviteMember } from "@/server/services/membershipService";
import { AuthError } from "@/server/services/authService";

const inviteSchema = z.object({
  groupId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["operator", "support"]),
});

export const POST = withAuth(async (req, session) => {
  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const forbidden = await requireRole(session.userId, parsed.data.groupId, "admin");
  if (forbidden) return forbidden;

  try {
    const invite = await inviteMember(parsed.data.groupId, {
      email: parsed.data.email,
      role: parsed.data.role,
    });
    return NextResponse.json(invite, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError && err.code === "ALREADY_MEMBER") {
      return NextResponse.json({ error: "ALREADY_MEMBER" }, { status: 409 });
    }
    throw err;
  }
});
