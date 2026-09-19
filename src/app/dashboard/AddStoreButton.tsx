"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Notice } from "@/components/Notice";
import { StoreForm } from "./StoreForm";

export function AddStoreButton({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Adicionar loja
      </Button>
      {open && (
        <Modal title="Adicionar loja" onClose={() => setOpen(false)}>
          <Notice variant="brass">
            Lojas ativas entram na cobrança mensal do grupo. Adicionar uma loja aqui pode aumentar o
            valor da próxima fatura.
          </Notice>
          <StoreForm groupId={groupId} onSuccess={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
