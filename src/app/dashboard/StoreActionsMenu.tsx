"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { KebabMenu } from "@/components/KebabMenu";
import { Modal } from "@/components/Modal";
import { Notice } from "@/components/Notice";
import { FormError } from "@/components/FormError";

export function StoreActionsMenu({
  storeId,
  storeName,
  active,
}: {
  storeId: string;
  storeName: string;
  active: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionLabel = active ? "Desativar loja" : "Ativar loja";

  async function handleToggle() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const endpoint = active ? "deactivate" : "activate";
      const res = await fetch(`/api/stores/${storeId}/${endpoint}`, { method: "POST" });
      if (res.ok) {
        setConfirmOpen(false);
        router.refresh();
        return;
      }
      setError(active ? "Não foi possível desativar a loja." : "Não foi possível ativar a loja.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // stop propagation so this doesn't also trigger the enclosing store row's click-to-navigate
    <div onClick={(e) => e.stopPropagation()}>
      <KebabMenu label={`Ações para ${storeName}`}>
        <button
          type="button"
          className={`menu-item ${active ? "menu-item-bad" : ""}`}
          onClick={() => setConfirmOpen(true)}
        >
          {actionLabel}
        </button>
      </KebabMenu>

      {confirmOpen && (
        <Modal title={actionLabel} onClose={() => setConfirmOpen(false)}>
          <Notice variant={active ? "bad" : "brass"}>
            {active ? (
              <>
                Ao desativar <strong>{storeName}</strong>, a cobrança do próximo mês será atualizada —
                lojas desativadas não entram na cobrança do grupo. Os dados da loja não são apagados.
              </>
            ) : (
              <>
                Ao ativar <strong>{storeName}</strong>, ela volta a contar na cobrança do grupo — isso
                vai aumentar o valor da próxima fatura.
              </>
            )}
          </Notice>
          <FormError message={error} />
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={active ? "bad" : "primary"}
              onClick={handleToggle}
              disabled={submitting}
            >
              {submitting ? (active ? "Desativando…" : "Ativando…") : actionLabel}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
