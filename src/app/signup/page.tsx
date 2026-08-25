"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, groupName }),
    });
    if (res.status === 201) {
      router.push("/dashboard");
      return;
    }
    if (res.status === 409) {
      setError("Esse e-mail já está cadastrado.");
      return;
    }
    setError("Não foi possível criar sua conta. Confira os dados e tente de novo.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Criar conta</h1>
      <label>
        Nome do grupo (franquia)
        <input value={groupName} onChange={(e) => setGroupName(e.target.value)} required minLength={2} />
      </label>
      <label>
        E-mail
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Senha
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Criar conta</button>
    </form>
  );
}
