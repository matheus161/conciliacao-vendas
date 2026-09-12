import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { listMembers, getStoreAssignmentIds } from "@/server/services/membershipService";
import { listStores } from "@/server/services/groupService";
import { RoleBadge } from "@/components/RoleBadge";
import { InviteForm } from "./InviteForm";
import { StoreAssignmentControl } from "./StoreAssignmentControl";

export default async function PessoasPage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({ where: { userId: session.userId } });
  if (!membership) redirect("/login");

  const isAdmin = membership.role === "admin";

  const [members, stores] = await Promise.all([
    listMembers(membership.groupId),
    listStores(membership.groupId),
  ]);

  const assignmentsByMembership = isAdmin
    ? Object.fromEntries(
        await Promise.all(
          members
            .filter((m) => m.role !== "admin")
            .map(async (m) => [m.id, await getStoreAssignmentIds(m.id)] as const)
        )
      )
    : {};

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
            <div key={m.id}>
              <div className="list-row">
                <div className="list-row-main">{m.email}</div>
                <RoleBadge role={m.role} />
              </div>
              {isAdmin && m.role !== "admin" && (
                <StoreAssignmentControl
                  membershipId={m.id}
                  groupStores={stores}
                  initialStoreIds={assignmentsByMembership[m.id] ?? []}
                />
              )}
            </div>
          ))}
          {isAdmin && <InviteForm groupId={membership.groupId} />}
        </div>
      </div>
    </>
  );
}
