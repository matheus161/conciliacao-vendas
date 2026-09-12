import Link from "next/link";
import { OnboardShell } from "@/components/OnboardShell";
import { Notice } from "@/components/Notice";

export default function InviteNotFound() {
  return (
    <OnboardShell>
      <div className="onboard-card">
        <h1>Este link não é mais válido</h1>
        <p className="lede">O convite pode ter expirado ou já ter sido usado.</p>

        <Notice variant="bad">
          <span>Peça a quem te convidou pra gerar um novo link.</span>
        </Notice>

        <p className="onboard-foot">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </OnboardShell>
  );
}
