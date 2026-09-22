import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { listStores } from "@/server/services/groupService";
import { getAccessibleStoreIds } from "@/server/services/membershipService";
import { AddStoreButton } from "./AddStoreButton";
import { StoreActionsMenu } from "./StoreActionsMenu";
import { StoreRow } from "./StoreRow";
import { ExampleNote } from "@/components/ExampleNote";
import { TrendChart } from "./TrendChart";

const PAGE_SIZE = 5;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.userId },
    include: { group: true },
  });
  if (!membership) redirect("/login");
  const isAdmin = membership.role === "admin";

  const accessible = await getAccessibleStoreIds(session.userId, membership.groupId);
  const stores = await listStores(membership.groupId, accessible, isAdmin);

  const requestedPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(stores.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageStores = stores.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = stores.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, stores.length);

  return (
    <>
      <div className="context-line">
        <span className="k">Grupo</span>
        <h1>{membership.group.name}</h1>
      </div>

      {membership.group.subscriptionStatus === "trialing" && (
        <div className="banner brass">
          <span className="banner-icon">🗓️</span>
          <span>
            Seu grupo está em <strong>período de teste</strong>. A cobrança automática ainda não está
            configurada.
          </span>
        </div>
      )}

      <div className="scoreboard">
        <div className="scoreboard-head">
          <div className="scoreboard-title">Conciliação de exemplo</div>
        </div>
        <div className="score-row">
          <div className="score-block">
            <div className="score-num">4.512</div>
            <div className="score-label">vendas no mês</div>
            <div className="score-sub">nas 12 lojas com fonte conectada</div>
          </div>
          <div className="score-block">
            <div className="score-num good">4.398</div>
            <div className="score-label">conciliadas</div>
            <div className="score-sub">97,5% bateram certinho</div>
          </div>
          <div className="score-block">
            <div className="score-num bad">114</div>
            <div className="score-label">com divergência</div>
            <div className="score-sub">18 já viraram chamado em aberto</div>
          </div>
        </div>
        <ExampleNote>
          Os números acima são ilustrativos. A conciliação real chega com o motor de conciliação (plano
          futuro).
        </ExampleNote>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Resumo das lojas</h2>
            <div className="panel-head-sub">Toque numa loja pra ver os detalhes</div>
          </div>
          {isAdmin && <AddStoreButton groupId={membership.groupId} />}
        </div>
        <div className="ledger-scroll">
          <table className="ledger">
            <thead>
              <tr>
                <th>Loja</th>
                <th className="num-col">Vendas</th>
                <th className="num-col">Conciliadas</th>
                <th className="num-col">Divergentes</th>
                <th>Situação</th>
                {isAdmin && <th>Status</th>}
                {isAdmin && <th aria-hidden="true" />}
              </tr>
            </thead>
            <tbody>
              {pageStores.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="cell-empty">
                    Nenhuma loja cadastrada ainda.
                  </td>
                </tr>
              ) : (
                pageStores.map((s) => (
                  <StoreRow storeId={s.id} key={s.id}>
                    <td className="cell-loja">{s.name}</td>
                    <td className="num-col cell-empty">—</td>
                    <td className="num-col cell-empty">—</td>
                    <td className="num-col cell-empty">—</td>
                    <td>
                      <span className="pill brass">Conectar fonte</span>
                    </td>
                    {isAdmin && (
                      <td>
                        {s.active ? (
                          <span className="pill good">Ativa</span>
                        ) : (
                          <span className="pill muted">Desativada</span>
                        )}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="actions-col">
                        <StoreActionsMenu storeId={s.id} storeName={s.name} active={s.active} />
                      </td>
                    )}
                  </StoreRow>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <div className="pager-range">
            Mostrando <b>{rangeStart}–{rangeEnd}</b> de <b>{stores.length}</b>
          </div>
          <div className="pager-btns">
            {page <= 1 ? (
              <button className="btn btn-ghost btn-sm" disabled>
                Anterior
              </button>
            ) : (
              <Link href={`/dashboard?page=${page - 1}`} className="btn btn-ghost btn-sm">
                Anterior
              </Link>
            )}
            {page >= totalPages ? (
              <button className="btn btn-ghost btn-sm" disabled>
                Próxima
              </button>
            ) : (
              <Link href={`/dashboard?page=${page + 1}`} className="btn btn-ghost btn-sm">
                Próxima
              </Link>
            )}
          </div>
        </div>
      </div>

      <TrendChart />
    </>
  );
}
