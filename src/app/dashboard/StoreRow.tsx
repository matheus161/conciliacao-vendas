"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function StoreRow({ storeId, children }: { storeId: string; children: ReactNode }) {
  const router = useRouter();

  function handleClick() {
    router.push(`/dashboard/lojas/${storeId}`);
  }

  return (
    <tr className="is-linked" onClick={handleClick}>
      {children}
    </tr>
  );
}
