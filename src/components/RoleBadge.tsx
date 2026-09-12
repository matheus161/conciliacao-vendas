import type { MemberRole } from "@/server/services/membershipService";

export const ROLE_LABEL: Record<MemberRole, string> = {
  admin: "Admin",
  operator: "Operador",
  support: "Atendimento",
};

export function RoleBadge({ role }: { role: MemberRole }) {
  const variant = role === "admin" ? "brass" : "good";
  return <span className={`pill ${variant}`}>{ROLE_LABEL[role]}</span>;
}
