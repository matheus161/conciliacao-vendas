"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";

export function StoreForm({ groupId, onSuccess }: { groupId: string; onSuccess?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ groupId, name, code, city }),
      });
      if (res.status === 201) {
        setName("");
        setCode("");
        setCity("");
        router.refresh();
        onSuccess?.();
        return;
      }
      setError("Não foi possível adicionar a loja.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field
        id="storeName"
        label="Nome da loja"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        minLength={2}
        disabled={submitting}
      />
      <Field
        id="storeCode"
        label="Código"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
        disabled={submitting}
      />
      <Field
        id="storeCity"
        label="Cidade"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        required
        disabled={submitting}
      />
      <FormError message={error} />
      <Button type="submit" disabled={submitting}>
        {submitting ? "Adicionando…" : "Adicionar loja"}
      </Button>
    </form>
  );
}
