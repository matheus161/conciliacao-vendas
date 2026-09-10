import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/withAuth";
import { acceptInviteForExistingUser, AuthError } from "@/server/services/authService";

export const POST = withAuth<{ params: { id: string } }>(async (_req, session, { params }) => {
  try {
    const result = await acceptInviteForExistingUser({
      pendingMembershipId: params.id,
      userId: session.userId,
    });
    return NextResponse.json({ groupId: result.groupId, role: result.role }, { status: 200 });
  } catch (err) {
    if (err instanceof AuthError && err.code === "INVITE_NOT_FOUND") {
      return NextResponse.json({ error: "INVITE_NOT_FOUND" }, { status: 404 });
    }
    throw err;
  }
});
