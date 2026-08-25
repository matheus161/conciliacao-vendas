import { NextRequest, NextResponse } from "next/server";
import { getInvitePreview } from "@/server/services/membershipService";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const invite = await getInvitePreview(params.id);
  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(invite, { status: 200 });
}
