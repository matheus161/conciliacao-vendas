"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <button type="button" onClick={handleClick} disabled={loading}>
        Confirmar entrada
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
