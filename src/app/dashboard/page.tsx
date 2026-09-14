import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { listStores } from "@/server/services/groupService";
import { getAccessibleStoreIds } from "@/server/services/membershipService";
import { StoreForm } from "./StoreForm";
import { StoreRow } from "./StoreRow";

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

  const accessible = await getAccessibleStoreIds(session.userId, membership.groupId);
  const stores = await listStores(membership.groupId, accessible);
  const isAdmin = membership.role === "admin";

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
        <h1>Todas as lojas</h1>
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
          <div className="scoreboard-title">Conciliação</div>
        </div>
        <div className="state-block">
          <div className="state-icon">📊</div>
          <h3>Nenhuma conciliação ainda</h3>
          <p>
            Vendas, conciliadas e divergências aparecem aqui assim que uma loja tiver uma fonte de dados
            conectada e a primeira planilha for processada.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Como cada loja está</h2>
          <div className="panel-head-sub">Toque numa loja pra ver os detalhes</div>
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
              </tr>
            </thead>
            <tbody>
              {pageStores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="cell-empty">
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

      {isAdmin && (
        <div className="panel">
          <div className="panel-head">
            <h2>Adicionar loja</h2>
          </div>
          <div className="panel-body">
            <StoreForm groupId={membership.groupId} />
          </div>
        </div>
      )}
    </>
  );
}
