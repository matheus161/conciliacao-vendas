import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvitePreview } from "@/server/services/membershipService";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { OnboardShell } from "@/components/OnboardShell";
import { RoleBadge } from "@/components/RoleBadge";
import { Notice } from "@/components/Notice";
import { AcceptInviteForm } from "./AcceptInviteForm";
import { ConfirmJoinButton } from "./ConfirmJoinButton";

export default async function JoinPage({ params }: { params: { id: string } }) {
  const invite = await getInvitePreview(params.id);
  if (!invite) notFound();

  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isLoggedInAsInvitedUser = session?.email === invite.email;

  return (
    <OnboardShell>
      <div className="onboard-card">
        <h1>Você foi convidado pra {invite.groupName}</h1>
        <div className="invite-meta">
          <span>{invite.email}</span>
          <RoleBadge role={invite.role} />
        </div>

        {invite.hasAccount ? (
          isLoggedInAsInvitedUser ? (
            <>
              <p className="lede">Sua conta já existe — confirme que quer entrar no grupo.</p>
              <ConfirmJoinButton inviteId={params.id} />
            </>
          ) : (
            <Notice>
              <span>
                Você já tem uma conta com <strong>{invite.email}</strong>.{" "}
                <Link href={`/login?next=/join/${params.id}`}>Entrar</Link> pra continuar.
              </span>
            </Notice>
          )
        ) : (
          <>
            <p className="lede">Crie uma senha pra começar a usar o Katalagge.</p>
            <AcceptInviteForm inviteId={params.id} />
          </>
        )}
      </div>
    </OnboardShell>
  );
}
