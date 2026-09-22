"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { StoreAssignmentControl } from "./StoreAssignmentControl";

type Store = { id: string; name: string };

export function StoreAccessButton({
  membershipId,
  memberEmail,
  groupStores,
  initialStoreIds,
}: {
  membershipId: string;
  memberEmail: string;
  groupStores: Store[];
  initialStoreIds: string[];
}) {
  const [open, setOpen] = useState(false);

  const summary =
    initialStoreIds.length === 0
      ? "Todas as lojas"
      : `${initialStoreIds.length} loja${initialStoreIds.length === 1 ? "" : "s"}`;

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {summary}
      </Button>
      {open && (
        <Modal title={`Acesso às lojas — ${memberEmail}`} onClose={() => setOpen(false)}>
          <StoreAssignmentControl
            membershipId={membershipId}
            groupStores={groupStores}
            initialStoreIds={initialStoreIds}
            onSaved={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
