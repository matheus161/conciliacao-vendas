"use client";

import { useRouter } from "next/navigation";
import { Button } from "./Button";

export function LogoutButton() {
  const router = useRouter();

  async function handleClick() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <Button type="button" onClick={handleClick}>
      Sair
    </Button>
  );
}
