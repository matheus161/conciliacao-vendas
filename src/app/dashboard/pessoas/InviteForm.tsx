"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";

export function InviteForm({ groupId }: { groupId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"operator" | "support">("operator");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteLink(null);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ groupId, email, role }),
    });
    if (res.status === 201) {
      const invite = await res.json();
      setInviteLink(`${window.location.origin}/join/${invite.id}`);
      setEmail("");
      return;
    }
    setError("Não foi possível criar o convite.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field
        id="inviteEmail"
        label="E-mail do convidado"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div className="field">
        <label htmlFor="inviteRole">Papel</label>
        <select
          id="inviteRole"
          value={role}
          onChange={(e) => setRole(e.target.value as "operator" | "support")}
        >
          <option value="operator">Operador</option>
          <option value="support">Atendimento</option>
        </select>
      </div>

      <FormError message={error} />

      <Button type="submit">Gerar convite</Button>

      {inviteLink && (
        <p className="field-hint">
          Envie este link pra pessoa convidada: <code>{inviteLink}</code>
        </p>
      )}
    </form>
  );
}
