"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

export function CopyInviteLinkButton({ inviteId }: { inviteId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const link = `${window.location.origin}/join/${inviteId}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleClick}>
      {copied ? "Copiado!" : "Copiar link"}
    </Button>
  );
}
