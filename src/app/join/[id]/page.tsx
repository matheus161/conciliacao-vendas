import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvitePreview } from "@/server/services/membershipService";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { AcceptInviteForm } from "./AcceptInviteForm";
import { ConfirmJoinButton } from "./ConfirmJoinButton";

export default async function JoinPage({ params }: { params: { id: string } }) {
  const invite = await getInvitePreview(params.id);
  if (!invite) notFound();

  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isLoggedInAsInvitedUser = session?.email === invite.email;

  return (
    <main>
      <h1>Entrar em {invite.groupName}</h1>
      <p>
        Convite para {invite.email} como {invite.role === "operator" ? "Operador" : "Atendimento"}.
      </p>

      {invite.hasAccount ? (
        isLoggedInAsInvitedUser ? (
          <ConfirmJoinButton inviteId={params.id} />
        ) : (
          <p>
            Você já tem uma conta com esse e-mail.{" "}
            <Link href={`/login?next=/join/${params.id}`}>Entrar</Link> para continuar.
          </p>
        )
      ) : (
        <AcceptInviteForm inviteId={params.id} />
      )}
    </main>
  );
}
