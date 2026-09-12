"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";

export function AcceptInviteForm({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/invites/${inviteId}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.status === 200) {
      router.push("/dashboard");
      return;
    }
    setError("Não foi possível aceitar o convite. Ele pode já ter sido usado.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field
        id="conviteSenha"
        label="Criar senha"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={10}
        hint="Mínimo de 10 caracteres"
      />

      <FormError message={error} />

      <Button block type="submit">
        Aceitar convite
      </Button>
    </form>
  );
}
