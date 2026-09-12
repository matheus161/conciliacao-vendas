"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";

export function ConfirmJoinButton({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/invites/${inviteId}/join`, { method: "POST" });
    setLoading(false);
    if (res.status === 200) {
      router.push("/dashboard");
      return;
    }
    setError("Não foi possível confirmar sua entrada. O convite pode já ter sido usado.");
  }

  return (
    <div>
      <Button block type="button" onClick={handleClick} disabled={loading}>
        {loading ? "Confirmando…" : "Confirmar entrada"}
      </Button>
      <FormError message={error} />
    </div>
  );
}
