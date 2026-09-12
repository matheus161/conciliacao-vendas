import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { listMembers } from "@/server/services/membershipService";
import { RoleBadge } from "@/components/RoleBadge";
import { InviteForm } from "./InviteForm";

export default async function PessoasPage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({ where: { userId: session.userId } });
  if (!membership) redirect("/login");

  const members = await listMembers(membership.groupId);
  const isAdmin = membership.role === "admin";

  return (
    <>
      <div className="context-line">
        <span className="k">Grupo</span>
        <h1>Pessoas</h1>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Membros</h2>
        </div>
        <div className="panel-body">
          {members.map((m) => (
            <div className="list-row" key={m.id}>
              <div className="list-row-main">{m.email}</div>
              <RoleBadge role={m.role} />
            </div>
          ))}
          {isAdmin && <InviteForm groupId={membership.groupId} />}
        </div>
      </div>
    </>
  );
}
