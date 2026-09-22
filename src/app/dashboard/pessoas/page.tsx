import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  listMembers,
  listPendingInvites,
  getStoreAssignmentIds,
} from "@/server/services/membershipService";
import { listStores } from "@/server/services/groupService";
import { RoleBadge, ROLE_LABEL } from "@/components/RoleBadge";
import { daysAgoLabel } from "@/lib/relativeTime";
import { InviteForm } from "./InviteForm";
import { StoreAccessButton } from "./StoreAccessButton";
import { CopyInviteLinkButton } from "./CopyInviteLinkButton";

const PAGE_SIZE = 5;

function paginate<T>(items: T[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = items.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, items.length);
  return { pageItems, page, totalPages, rangeStart, rangeEnd };
}

export default async function PessoasPage({
  searchParams,
}: {
  searchParams: { ativosPage?: string; pendentesPage?: string };
}) {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({ where: { userId: session.userId } });
  if (!membership) redirect("/login");
  if (membership.role !== "admin") redirect("/dashboard");

  const [members, pendingInvites, stores] = await Promise.all([
    listMembers(membership.groupId),
    listPendingInvites(membership.groupId),
    listStores(membership.groupId),
  ]);

  const assignmentsByMembership = Object.fromEntries(
    await Promise.all(
      members
        .filter((m) => m.role !== "admin")
        .map(async (m) => [m.id, await getStoreAssignmentIds(m.id)] as const)
    )
  );

  const ativos = paginate(members, parseInt(searchParams.ativosPage ?? "1", 10) || 1);
  const pendentes = paginate(pendingInvites, parseInt(searchParams.pendentesPage ?? "1", 10) || 1);

  return (
    <>
      <div className="context-line">
        <span className="k">Grupo</span>
        <h1>Pessoas com acesso</h1>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Convidar alguém da equipe</h2>
            <div className="panel-head-sub">
              Você recebe um link pra compartilhar por WhatsApp ou e-mail — sem envio automático nesta
              versão
            </div>
          </div>
        </div>
        <div className="panel-body">
          <InviteForm groupId={membership.groupId} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Ativos</h2>
        </div>
        <div className="panel-body">
          {ativos.pageItems.map((m) => (
            <div className="list-row" key={m.id}>
              <div className="list-row-main">{m.email}</div>
              <div className="list-row-actions">
                <RoleBadge role={m.role} />
                {m.role !== "admin" && (
                  <StoreAccessButton
                    membershipId={m.id}
                    memberEmail={m.email}
                    groupStores={stores}
                    initialStoreIds={assignmentsByMembership[m.id] ?? []}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="pager">
          <div className="pager-range">
            Mostrando <b>{ativos.rangeStart}–{ativos.rangeEnd}</b> de <b>{members.length}</b>
          </div>
          <div className="pager-btns">
            {ativos.page <= 1 ? (
              <button className="btn btn-ghost btn-sm" disabled>
                Anterior
              </button>
            ) : (
              <Link href={`/dashboard/pessoas?ativosPage=${ativos.page - 1}`} className="btn btn-ghost btn-sm">
                Anterior
              </Link>
            )}
            {ativos.page >= ativos.totalPages ? (
              <button className="btn btn-ghost btn-sm" disabled>
                Próxima
              </button>
            ) : (
              <Link href={`/dashboard/pessoas?ativosPage=${ativos.page + 1}`} className="btn btn-ghost btn-sm">
                Próxima
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Convites pendentes</h2>
        </div>
        <div className="panel-body">
          {pendentes.pageItems.length === 0 ? (
            <p className="list-empty">Nenhum convite pendente.</p>
          ) : (
            pendentes.pageItems.map((invite) => (
              <div className="list-row" key={invite.id}>
                <div>
                  <div className="list-row-main">{invite.email}</div>
                  <div className="list-row-sub">
                    {ROLE_LABEL[invite.role]} · {daysAgoLabel(invite.createdAt)}
                  </div>
                </div>
                <div className="list-row-actions">
                  <span className="pill brass">Aguardando aceite</span>
                  <CopyInviteLinkButton inviteId={invite.id} />
                </div>
              </div>
            ))
          )}
        </div>
        <div className="pager">
          <div className="pager-range">
            Mostrando <b>{pendentes.rangeStart}–{pendentes.rangeEnd}</b> de <b>{pendingInvites.length}</b>
          </div>
          <div className="pager-btns">
            {pendentes.page <= 1 ? (
              <button className="btn btn-ghost btn-sm" disabled>
                Anterior
              </button>
            ) : (
              <Link
                href={`/dashboard/pessoas?pendentesPage=${pendentes.page - 1}`}
                className="btn btn-ghost btn-sm"
              >
                Anterior
              </Link>
            )}
            {pendentes.page >= pendentes.totalPages ? (
              <button className="btn btn-ghost btn-sm" disabled>
                Próxima
              </button>
            ) : (
              <Link
                href={`/dashboard/pessoas?pendentesPage=${pendentes.page + 1}`}
                className="btn btn-ghost btn-sm"
              >
                Próxima
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
