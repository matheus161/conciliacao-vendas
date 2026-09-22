"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";

export function InviteForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"operator" | "support">("operator");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setInviteLink(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ groupId, email, role }),
      });
      if (res.status === 201) {
        const invite = await res.json();
        setInviteLink(`${window.location.origin}/join/${invite.id}`);
        setEmail("");
        router.refresh();
        return;
      }
      if (res.status === 409) {
        const body = await res.json().catch(() => null);
        if (body?.error === "ALREADY_MEMBER") {
          setError("Esse e-mail já é membro deste grupo.");
          return;
        }
      }
      setError("Não foi possível criar o convite.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="inline-form-row">
        <Field
          id="inviteEmail"
          label="E-mail da pessoa"
          type="email"
          placeholder="nome@suaempresa.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={submitting}
        />
        <div className="field">
          <label htmlFor="inviteRole">Função</label>
          <select
            id="inviteRole"
            value={role}
            onChange={(e) => setRole(e.target.value as "operator" | "support")}
            disabled={submitting}
          >
            <option value="operator">Operador</option>
            <option value="support">Atendimento</option>
          </select>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Gerando…" : "Gerar link de convite"}
        </Button>
      </div>

      <FormError message={error} />

      {inviteLink && (
        <p className="field-hint">
          Envie este link pra pessoa convidada: <code>{inviteLink}</code>
        </p>
      )}
    </form>
  );
}
