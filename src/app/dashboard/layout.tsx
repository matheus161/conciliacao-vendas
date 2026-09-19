import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { listStores } from "@/server/services/groupService";
import { getAccessibleStoreIds } from "@/server/services/membershipService";
import { ROLE_LABEL } from "@/components/RoleBadge";
import { LogoutButton } from "@/components/LogoutButton";
import { Rail } from "@/components/Rail";
import { subscriptionStatusLabel } from "@/lib/subscriptionStatus";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.userId },
    include: { group: true },
  });
  if (!membership) redirect("/login");

  const accessible = await getAccessibleStoreIds(session.userId, membership.groupId);
  const stores = await listStores(membership.groupId, accessible);

  return (
    <div className="authed-shell">
      <div className="topbar">
        <div className="topbar-brand">
          <span className="topbar-mark">K</span>Katalagge
        </div>
        <div className="topbar-billing">
          <span className="dot" />
          {subscriptionStatusLabel(membership.group.subscriptionStatus)}
        </div>
        <div className="topbar-profile">
          <div className="topbar-avatar">{session.email.slice(0, 2).toUpperCase()}</div>
          <div className="topbar-profile-text">
            <span className="topbar-name">{session.email}</span>
            <span className="topbar-role">{ROLE_LABEL[membership.role as keyof typeof ROLE_LABEL]}</span>
          </div>
        </div>
        <LogoutButton />
      </div>

      <div className="app-shell">
        <Rail
          groupName={membership.group.name}
          stores={stores.map((s) => ({ id: s.id, name: s.name }))}
          isAdmin={membership.role === "admin"}
        />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
