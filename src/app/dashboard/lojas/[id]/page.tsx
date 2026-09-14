import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getAccessibleStoreIds } from "@/server/services/membershipService";

export default async function StorePage({ params }: { params: { id: string } }) {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({ where: { userId: session.userId } });
  if (!membership) redirect("/login");

  const store = await db.store.findFirst({ where: { id: params.id, groupId: membership.groupId } });
  if (!store) notFound();

  const accessible = await getAccessibleStoreIds(session.userId, membership.groupId);
  if (accessible !== "all" && !accessible.includes(store.id)) notFound();

  return (
    <>
      <div className="context-line">
        <span className="k">Loja</span>
        <h1>{store.name}</h1>
      </div>

      <div className="state-block">
        <div className="state-icon">🏬</div>
        <h3>Visão da loja chega em breve</h3>
        <p>
          A conciliação individual de {store.name} aparece aqui assim que essa tela for construída num
          próximo passo do plano.
        </p>
      </div>
    </>
  );
}
