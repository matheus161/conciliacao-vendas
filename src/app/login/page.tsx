"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OnboardShell } from "@/components/OnboardShell";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";

function safeRedirectTarget(next: string | null): string {
  if (next && /^\/(?!\/)/.test(next) && !next.includes("\\")) return next;
  return "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.status === 200) {
      router.push(safeRedirectTarget(searchParams.get("next")));
      return;
    }
    setError("E-mail ou senha incorretos.");
  }

  return (
    <OnboardShell>
      <div className="onboard-card">
        <h1>Entrar</h1>
        <p className="lede">Acesse o painel de conciliação da sua franquia.</p>

        <form onSubmit={handleSubmit}>
          <Field
            id="loginEmail"
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Field
            id="loginSenha"
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <FormError message={error} />

          <Button block type="submit">
            Entrar
          </Button>
        </form>

        <p className="onboard-foot">
          Ainda não tem conta? <Link href="/signup">Criar conta</Link>
        </p>
      </div>
    </OnboardShell>
  );
}
