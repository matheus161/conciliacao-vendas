"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

type Store = { id: string; name: string };

export function StoreAssignmentControl({
  membershipId,
  groupStores,
  initialStoreIds,
  onSaved,
}: {
  membershipId: string;
  groupStores: Store[];
  initialStoreIds: string[];
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initialStoreIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(storeId: string) {
    setSelected((prev) => (prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]));
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/memberships/${membershipId}/stores`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ storeIds: selected }),
      });
      if (res.status === 200) {
        router.refresh();
        onSaved?.();
        return;
      }
      setError("Não foi possível salvar o acesso.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="store-assignment">
      <p className="field-hint">
        {selected.length === 0
          ? "Sem restrição — vê todas as lojas do grupo."
          : `Restrito a ${selected.length} loja${selected.length === 1 ? "" : "s"}.`}
      </p>
      <div className="store-assignment-list">
        {groupStores.map((s) => (
          <label className="store-assignment-item" key={s.id}>
            <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
            {s.name}
          </label>
        ))}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Salvando…" : "Salvar acesso"}
      </Button>
    </div>
  );
}
