"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
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
      router.push("/dashboard");
      return;
    }
    setError("E-mail ou senha incorretos.");
  }

  return (
    <div className="onboard">
      <div className="onboard-wrap">
        <div className="onboard-brand">
          <div className="onboard-brand-mark">K</div>
          <div className="onboard-brand-name">Katalagge</div>
        </div>

        <div className="onboard-card">
          <h1>Entrar</h1>
          <p className="lede">Acesse o painel de conciliação da sua franquia.</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="loginEmail">E-mail</label>
              <input
                id="loginEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="loginSenha">Senha</label>
              <input
                id="loginSenha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}

            <button className="btn btn-primary btn-block" type="submit">
              Entrar
            </button>
          </form>

          <p className="onboard-foot">
            Ainda não tem conta? <Link href="/signup">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
