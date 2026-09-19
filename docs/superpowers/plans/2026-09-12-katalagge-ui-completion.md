# Katalagge UI Completion — Visão do grupo & Pessoas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the two already-shipped Katalagge screens (Visão do grupo, Pessoas) with the prototype's design, closing the gaps found in the design audit — trend chart, illustrative reconciliation summary, clickable store rows, honest billing status, and a working "Convites pendentes" list with pagination.

**Architecture:** Same Next.js (App Router, TypeScript) + Prisma app as the rest of the codebase. No new subsystem — every task here is presentation, a thin route, or a small service function on top of existing tables. A new shared `ExampleNote` component marks any illustrative data (numbers that depend on the reconciliation engine, which this plan does not build) so it's never mistaken for a real customer's numbers.

**Tech Stack:** Next.js 14 (App Router) + TypeScript, Prisma + PostgreSQL, Vitest.

This is the first slice of the plan described in `docs/superpowers/specs/2026-09-12-katalagge-ui-completion-design.md` (§3–4). The remaining 7 screens (§5 of that spec) get their own plan(s), written when each becomes the active screen — see that spec's §2 for why.

## Global Constraints

- All application code is TypeScript — no `.js` source files.
- Every query stays isolated by `groupId` (and, where relevant, by `getAccessibleStoreIds`) — no query in this plan reads across groups or bypasses per-store restriction.
- **Two-tier data rule** (design spec §2): a feature this plan builds but with no data yet (no stores, no pending invites) shows an honest empty state, never a fabricated number. Data that depends on a subsystem this plan does *not* build (the reconciliation engine) is shown as illustrative data, always wrapped in the shared `ExampleNote` component so it's visibly marked as an example — never presented as if it were real.
- No motor de conciliação, no real billing/charge processing, no worker/queue — out of scope for this plan (design spec §2).
- Follow existing project conventions: services in `src/server/services/`, small pure helpers in `src/lib/`, no automated tests for `.tsx` pages/components (none exist in this codebase — verified manually via `npm run dev`), automated Vitest tests for service/lib functions.

---

### Task 1: Shared "dado de exemplo" indicator

**Files:**
- Create: `src/components/ExampleNote.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `ExampleNote` component (`{ children: ReactNode }`) — used by Task 4 (scoreboard/tendência) and every future task that shows illustrative data.

- [ ] **Step 1: Write `src/components/ExampleNote.tsx`**

```tsx
import type { ReactNode } from "react";

export function ExampleNote({ children }: { children: ReactNode }) {
  return (
    <p className="example-note">
      <span className="pill example">Dado de exemplo</span>
      {children}
    </p>
  );
}
```

- [ ] **Step 2: Add CSS**

In `src/app/globals.css`, find this block:

```css
.pill.good {
  background: var(--good-soft);
  color: var(--good);
}

/* ---- status banner (subscription, alerts) ---- */
```

Replace it with:

```css
.pill.good {
  background: var(--good-soft);
  color: var(--good);
}

.pill.example {
  background: rgba(28, 43, 58, 0.08);
  color: var(--ink-muted);
  font-style: italic;
}

.example-note {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--ink-muted);
  margin-top: 10px;
}

/* ---- status banner (subscription, alerts) ---- */
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ExampleNote.tsx src/app/globals.css
git commit -m "feat: add shared example-data indicator"
```

---

### Task 2: Honest subscription-status pill in the topbar

**Files:**
- Create: `src/lib/subscriptionStatus.ts`
- Test: `src/lib/subscriptionStatus.test.ts`
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `membership.group.subscriptionStatus` (already loaded in `layout.tsx`).
- Produces: `subscriptionStatusLabel(status: string): string` — used by `layout.tsx` now, and reusable wherever `subscriptionStatus` needs a human label later (e.g. Faturas).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { subscriptionStatusLabel } from "./subscriptionStatus";

describe("subscriptionStatusLabel", () => {
  it("labels known statuses in Portuguese", () => {
    expect(subscriptionStatusLabel("trialing")).toBe("Período de teste");
    expect(subscriptionStatusLabel("active")).toBe("Assinatura ativa");
    expect(subscriptionStatusLabel("past_due")).toBe("Pagamento pendente");
    expect(subscriptionStatusLabel("canceled")).toBe("Assinatura cancelada");
  });

  it("falls back to a generic label for an unknown status", () => {
    expect(subscriptionStatusLabel("whatever")).toBe("Assinatura");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/subscriptionStatus.test.ts`
Expected: FAIL — `Cannot find module './subscriptionStatus'`

- [ ] **Step 3: Write the implementation**

```ts
const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  trialing: "Período de teste",
  active: "Assinatura ativa",
  past_due: "Pagamento pendente",
  canceled: "Assinatura cancelada",
};

export function subscriptionStatusLabel(status: string): string {
  return SUBSCRIPTION_STATUS_LABEL[status] ?? "Assinatura";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/subscriptionStatus.test.ts`
Expected: `Test Files  1 passed (1)`, `Tests  2 passed (2)`

- [ ] **Step 5: Add the pill to the topbar**

In `src/app/dashboard/layout.tsx`, add the import:

```tsx
import { subscriptionStatusLabel } from "@/lib/subscriptionStatus";
```

Replace:

```tsx
      <div className="topbar">
        <div className="topbar-brand">
          <span className="topbar-mark">K</span>Katalagge
        </div>
        <div className="topbar-profile">
```

With:

```tsx
      <div className="topbar">
        <div className="topbar-brand">
          <span className="topbar-mark">K</span>Katalagge
        </div>
        <div className="topbar-billing">
          <span className="dot" />
          {subscriptionStatusLabel(membership.group.subscriptionStatus)}
        </div>
        <div className="topbar-profile">
```

- [ ] **Step 6: Add CSS and move the right-alignment to the new pill**

In `src/app/globals.css`, replace:

```css
.topbar-profile {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 9px;
}
```

With:

```css
.topbar-billing {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: rgba(237, 239, 234, 0.8);
  background: rgba(255, 255, 255, 0.07);
  padding: 6px 12px;
  border-radius: 999px;
}

.topbar-billing .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--good);
  flex-shrink: 0;
}

.topbar-profile {
  display: flex;
  align-items: center;
  gap: 9px;
}
```

- [ ] **Step 7: Verify manually**

Run: `npm run dev`, log in as an admin of a trialing group, confirm the topbar shows "Período de teste" between the brand and the profile, right-aligned before the profile/logout button.
Expected: pill renders, no console errors, no layout overlap at narrow widths.

- [ ] **Step 8: Commit**

```bash
git add src/lib/subscriptionStatus.ts src/lib/subscriptionStatus.test.ts src/app/dashboard/layout.tsx src/app/globals.css
git commit -m "feat: show honest subscription-status pill in topbar"
```

---

### Task 3: Store detail stub route + clickable store rows

**Files:**
- Create: `src/app/dashboard/lojas/[id]/page.tsx`
- Create: `src/app/dashboard/StoreRow.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/Rail.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `getAccessibleStoreIds` (`@/server/services/membershipService`), `db` (`@/lib/db`).
- Produces: route `/dashboard/lojas/[id]`; `StoreRow` component (`{ storeId: string; children: ReactNode }`) — used by `dashboard/page.tsx` now, reusable by future ledger-style tables.

- [ ] **Step 1: Write `src/app/dashboard/StoreRow.tsx`**

```tsx
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
```

- [ ] **Step 2: Write `src/app/dashboard/lojas/[id]/page.tsx`**

```tsx
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getAccessibleStoreIds } from "@/server/services/membershipService";

export default async function StorePage({ params }: { params: { id: string } }) {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({ where: { userId: session.userId } });
  if (!membership) redirect("/login");

  const store = await db.store.findFirst({ where: { id: params.id, groupId: membership.groupId } });
  if (!store) notFound();

  const accessible = await getAccessibleStoreIds(session.userId, membership.groupId);
  if (accessible !== "all" && !accessible.includes(store.id)) notFound();

  return (
    <>
      <div className="context-line">
        <span className="k">Loja</span>
        <h1>{store.name}</h1>
      </div>

      <div className="state-block">
        <div className="state-icon">🏬</div>
        <h3>Visão da loja chega em breve</h3>
        <p>
          A conciliação individual de {store.name} aparece aqui assim que essa tela for construída num
          próximo passo do plano.
        </p>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Make ledger rows clickable in `src/app/dashboard/page.tsx`**

Add the import:

```tsx
import { StoreRow } from "./StoreRow";
```

Replace:

```tsx
      <div className="panel">
        <div className="panel-head">
          <h2>Como cada loja está</h2>
        </div>
```

With:

```tsx
      <div className="panel">
        <div className="panel-head">
          <h2>Como cada loja está</h2>
          <div className="panel-head-sub">Toque numa loja pra ver os detalhes</div>
        </div>
```

Replace:

```tsx
                pageStores.map((s) => (
                  <tr key={s.id}>
                    <td className="cell-loja">{s.name}</td>
                    <td className="num-col cell-empty">—</td>
                    <td className="num-col cell-empty">—</td>
                    <td className="num-col cell-empty">—</td>
                    <td>
                      <span className="pill brass">Conectar fonte</span>
                    </td>
                  </tr>
                ))
```

With:

```tsx
                pageStores.map((s) => (
                  <StoreRow storeId={s.id} key={s.id}>
                    <td className="cell-loja">{s.name}</td>
                    <td className="num-col cell-empty">—</td>
                    <td className="num-col cell-empty">—</td>
                    <td className="num-col cell-empty">—</td>
                    <td>
                      <span className="pill brass">Conectar fonte</span>
                    </td>
                  </StoreRow>
                ))
```

- [ ] **Step 4: Make the rail's store rows real links in `src/components/Rail.tsx`**

Replace:

```tsx
                stores.map((s) => (
                  <span className="rail-loja-row" key={s.id}>
                    <span className="rail-dot" />
                    <span className="truncate">{s.name}</span>
                  </span>
                ))
```

With:

```tsx
                stores.map((s) => (
                  <Link className="rail-loja-row" href={`/dashboard/lojas/${s.id}`} key={s.id}>
                    <span className="rail-dot" />
                    <span className="truncate">{s.name}</span>
                  </Link>
                ))
```

- [ ] **Step 5: Add CSS**

In `src/app/globals.css`, replace:

```css
.rail-loja-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 7px;
  font-size: 13px;
  color: var(--ink-muted);
  white-space: nowrap;
}
```

With:

```css
.rail-loja-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 7px;
  font-size: 13px;
  color: var(--ink-muted);
  text-decoration: none;
  white-space: nowrap;
}

a.rail-loja-row:hover {
  background: rgba(28, 43, 58, 0.05);
  color: var(--ink);
}
```

Replace:

```css
.cell-empty {
  color: var(--ink-muted);
}
```

With:

```css
.cell-empty {
  color: var(--ink-muted);
}

tr.is-linked {
  cursor: pointer;
}

tr.is-linked:hover {
  background: var(--brass-soft);
}
```

- [ ] **Step 6: Verify manually**

Run: `npm run dev`. On `/dashboard`, click a store row in the ledger and confirm it navigates to `/dashboard/lojas/[id]` showing the store name and the "em breve" state. Expand "Lojas" in the rail and click a store there too — same result. Manually visit `/dashboard/lojas/does-not-exist` and confirm a 404. If the logged-in user is a restricted operator (has `MembershipStore` rows), confirm visiting another group's store id, or a store outside their assignment, also 404s.
Expected: all navigations work, no console errors, restricted stores are not reachable.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/StoreRow.tsx src/app/dashboard/lojas src/app/dashboard/page.tsx src/components/Rail.tsx src/app/globals.css
git commit -m "feat: add store detail stub route and make store rows clickable"
```

---

### Task 4: Illustrative conciliação summary — scoreboard + tendência

**Files:**
- Create: `src/app/dashboard/TrendChart.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `ExampleNote` (Task 1).
- Produces: `TrendChart` component (no props) — used by `dashboard/page.tsx`.

- [ ] **Step 1: Write `src/app/dashboard/TrendChart.tsx`**

```tsx
import { ExampleNote } from "@/components/ExampleNote";

export function TrendChart() {
  return (
    <div className="chart-panel">
      <span className="chart-tab">Últimos 6 meses</span>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-swatch" />% conciliado
        </span>
      </div>
      <svg
        viewBox="0 0 640 190"
        width="100%"
        height="190"
        role="img"
        aria-label="Percentual conciliado de março a agosto, subindo de 93,1% para 97,5% (dado de exemplo)"
      >
        <line x1="40" y1="20" x2="40" y2="150" stroke="var(--rule)" strokeWidth="1" />
        <line x1="40" y1="150" x2="620" y2="150" stroke="var(--rule)" strokeWidth="1" />
        <text x="10" y="24" fontSize="11" fill="var(--ink-muted)">100%</text>
        <text x="10" y="88" fontSize="11" fill="var(--ink-muted)">95%</text>
        <text x="14" y="154" fontSize="11" fill="var(--ink-muted)">90%</text>
        <line x1="40" y1="20" x2="620" y2="20" stroke="var(--rule)" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="40" y1="85" x2="620" y2="85" stroke="var(--rule)" strokeWidth="1" strokeDasharray="2 4" />
        <path
          d="M60,111 L176,98 L292,124 L408,72 L524,59 L600,33 L600,150 L60,150 Z"
          fill="var(--good)"
          opacity="0.10"
        />
        <path
          d="M60,111 L176,98 L292,124 L408,72 L524,59 L600,33"
          fill="none"
          stroke="var(--good)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="60" cy="111" r="3.5" fill="var(--good)" />
        <circle cx="600" cy="33" r="4.5" fill="var(--good)" />
        <text x="52" y="128" fontSize="11.5" fill="var(--ink-muted)">Mar</text>
        <text x="168" y="128" fontSize="11.5" fill="var(--ink-muted)">Abr</text>
        <text x="284" y="140" fontSize="11.5" fill="var(--ink-muted)">Mai</text>
        <text x="400" y="128" fontSize="11.5" fill="var(--ink-muted)">Jun</text>
        <text x="516" y="128" fontSize="11.5" fill="var(--ink-muted)">Jul</text>
        <text x="574" y="128" fontSize="11.5" fill="var(--ink-muted)" fontWeight="700">Ago</text>
        <text x="560" y="24" fontSize="13" fill="var(--good)" fontWeight="700">97,5%</text>
      </svg>
      <ExampleNote>
        A tendência real chega com o motor de conciliação (plano futuro) — este gráfico é ilustrativo.
      </ExampleNote>
    </div>
  );
}
```

- [ ] **Step 2: Replace the scoreboard's empty state in `src/app/dashboard/page.tsx`**

Add the imports:

```tsx
import { ExampleNote } from "@/components/ExampleNote";
import { TrendChart } from "./TrendChart";
```

Replace:

```tsx
      <div className="scoreboard">
        <div className="scoreboard-head">
          <div className="scoreboard-title">Conciliação</div>
        </div>
        <div className="state-block">
          <div className="state-icon">📊</div>
          <h3>Nenhuma conciliação ainda</h3>
          <p>
            Vendas, conciliadas e divergências aparecem aqui assim que uma loja tiver uma fonte de dados
            conectada e a primeira planilha for processada.
          </p>
        </div>
      </div>
```

With:

```tsx
      <div className="scoreboard">
        <div className="scoreboard-head">
          <div className="scoreboard-title">Conciliação de exemplo</div>
        </div>
        <div className="score-row">
          <div className="score-block">
            <div className="score-num">4.512</div>
            <div className="score-label">vendas no mês</div>
            <div className="score-sub">nas 12 lojas com fonte conectada</div>
          </div>
          <div className="score-block">
            <div className="score-num good">4.398</div>
            <div className="score-label">conciliadas</div>
            <div className="score-sub">97,5% bateram certinho</div>
          </div>
          <div className="score-block">
            <div className="score-num bad">114</div>
            <div className="score-label">com divergência</div>
            <div className="score-sub">18 já viraram chamado em aberto</div>
          </div>
        </div>
        <ExampleNote>
          Os números acima são ilustrativos. A conciliação real chega com o motor de conciliação (plano
          futuro).
        </ExampleNote>
      </div>

      <TrendChart />
```

- [ ] **Step 3: Add CSS**

In `src/app/globals.css`, find the section comment `/* ---- ledger table (stores overview) ---- */` and insert this block immediately before it:

```css
/* ---- trend chart (illustrative) ---- */
.chart-panel {
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 2px 12px 12px 12px;
  position: relative;
  padding: 26px 24px 20px;
  box-shadow: 0 1px 2px rgba(20, 30, 40, 0.03), 0 14px 28px -22px rgba(20, 30, 40, 0.32);
}

.chart-tab {
  position: absolute;
  top: -14px;
  left: 0;
  background: var(--brass);
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 8px 8px 0 0;
}

.chart-legend {
  display: flex;
  gap: 18px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--ink-muted);
}

.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--good);
}

```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, open `/dashboard`. Confirm the scoreboard shows the three illustrative numbers with the "Dado de exemplo" note beneath, and the trend chart renders below the ledger's pager with its own note.
Expected: renders correctly at desktop and narrow (~400px) widths, no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/TrendChart.tsx src/app/dashboard/page.tsx src/app/globals.css
git commit -m "feat: show illustrative conciliação summary and trend chart"
```

---

### Task 5: `listPendingInvites` in membershipService

**Files:**
- Modify: `src/server/services/membershipService.ts`
- Modify: `src/server/services/membershipService.test.ts`

**Interfaces:**
- Produces: `PendingInviteSummary = { id: string; email: string; role: MemberRole; createdAt: Date }`, `listPendingInvites(groupId: string): Promise<PendingInviteSummary[]>` — used by the Pessoas page (Task 7).

- [ ] **Step 1: Write the failing test**

Append to `src/server/services/membershipService.test.ts`:

```ts
describe("listPendingInvites", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("lists pending invites for a group, newest first", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const first = await inviteMember(groupId, { email: "primeiro@franquia.com", role: "operator" });
    const second = await inviteMember(groupId, { email: "segundo@franquia.com", role: "support" });

    const pending = await listPendingInvites(groupId);
    expect(pending.map((p) => p.id)).toEqual([second.id, first.id]);
    expect(pending[0]).toMatchObject({ email: "segundo@franquia.com", role: "support" });
  });

  it("excludes accepted invites and invites from another group", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const other = await signup({
      email: "admin2@outra.com",
      password: "supersecret1",
      groupName: "Outra Franquia",
    });

    const toAccept = await inviteMember(groupId, { email: "aceito@franquia.com", role: "operator" });
    await acceptInvite({ pendingMembershipId: toAccept.id, password: "outrasenha123" });
    await inviteMember(other.groupId, { email: "outro@outra.com", role: "operator" });

    expect(await listPendingInvites(groupId)).toEqual([]);
  });
});
```

Add `listPendingInvites` to the existing membershipService import at the top of the file:

```ts
import {
  getMembershipRole,
  listMembers,
  inviteMember,
  getInvitePreview,
  getAccessibleStoreIds,
  getStoreAssignmentIds,
  setStoreAssignments,
  listPendingInvites,
} from "./membershipService";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/services/membershipService.test.ts`
Expected: FAIL — `listPendingInvites is not a function`

- [ ] **Step 3: Write the implementation**

Append to `src/server/services/membershipService.ts`:

```ts
export type PendingInviteSummary = { id: string; email: string; role: MemberRole; createdAt: Date };

export async function listPendingInvites(groupId: string): Promise<PendingInviteSummary[]> {
  const pending = await db.pendingMembership.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
  });
  return pending.map((p) => ({ id: p.id, email: p.email, role: p.role as MemberRole, createdAt: p.createdAt }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/server/services/membershipService.test.ts`
Expected: all tests in the file pass, including the two new ones.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/membershipService.ts src/server/services/membershipService.test.ts
git commit -m "feat: add listPendingInvites to membershipService"
```

---

### Task 6: `daysAgoLabel` helper

**Files:**
- Create: `src/lib/relativeTime.ts`
- Test: `src/lib/relativeTime.test.ts`

**Interfaces:**
- Produces: `daysAgoLabel(date: Date): string` — used by the Pessoas page (Task 8).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { daysAgoLabel } from "./relativeTime";

describe("daysAgoLabel", () => {
  it("labels today, one day, and multiple days", () => {
    const now = new Date();
    expect(daysAgoLabel(now)).toBe("convidado hoje");

    const oneDayAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    expect(daysAgoLabel(oneDayAgo)).toBe("convidado há 1 dia");

    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 - 60 * 1000);
    expect(daysAgoLabel(fiveDaysAgo)).toBe("convidado há 5 dias");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/relativeTime.test.ts`
Expected: FAIL — `Cannot find module './relativeTime'`

- [ ] **Step 3: Write the implementation**

```ts
export function daysAgoLabel(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const days = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
  if (days === 0) return "convidado hoje";
  if (days === 1) return "convidado há 1 dia";
  return `convidado há ${days} dias`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/relativeTime.test.ts`
Expected: `Test Files  1 passed (1)`, `Tests  1 passed (1)`

- [ ] **Step 5: Commit**

```bash
git add src/lib/relativeTime.ts src/lib/relativeTime.test.ts
git commit -m "feat: add daysAgoLabel helper"
```

---

### Task 7: Pessoas — "Convidar alguém da equipe" panel

**Files:**
- Modify: `src/app/dashboard/pessoas/InviteForm.tsx`
- Modify: `src/app/dashboard/pessoas/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- No new exported interfaces — this task only restructures existing markup/CSS.

- [ ] **Step 1: Rewrite `src/app/dashboard/pessoas/InviteForm.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";

export function InviteForm({ groupId }: { groupId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"operator" | "support">("operator");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteLink(null);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ groupId, email, role }),
    });
    if (res.status === 201) {
      const invite = await res.json();
      setInviteLink(`${window.location.origin}/join/${invite.id}`);
      setEmail("");
      return;
    }
    setError("Não foi possível criar o convite.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="inline-form-row">
        <Field
          id="inviteEmail"
          label="E-mail da pessoa"
          type="email"
          placeholder="nome@suaempresa.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="field">
          <label htmlFor="inviteRole">Função</label>
          <select
            id="inviteRole"
            value={role}
            onChange={(e) => setRole(e.target.value as "operator" | "support")}
          >
            <option value="operator">Operador</option>
            <option value="support">Atendimento</option>
          </select>
        </div>
        <Button type="submit">Gerar link de convite</Button>
      </div>

      <FormError message={error} />

      {inviteLink && (
        <p className="field-hint">
          Envie este link pra pessoa convidada: <code>{inviteLink}</code>
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Wrap the form in its own panel and fix the title in `src/app/dashboard/pessoas/page.tsx`**

Replace:

```tsx
      <div className="context-line">
        <span className="k">Grupo</span>
        <h1>Pessoas</h1>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Membros</h2>
        </div>
        <div className="panel-body">
          {members.map((m) => (
```

With:

```tsx
      <div className="context-line">
        <span className="k">Grupo</span>
        <h1>Pessoas com acesso</h1>
      </div>

      {isAdmin && (
        <div className="panel">
          <div className="panel-head">
            <h2>Convidar alguém da equipe</h2>
            <div className="panel-head-sub">
              Você recebe um link pra compartilhar por WhatsApp ou e-mail — sem envio automático nesta
              versão
            </div>
          </div>
          <div className="panel-body">
            <InviteForm groupId={membership.groupId} />
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <h2>Membros</h2>
        </div>
        <div className="panel-body">
          {members.map((m) => (
```

Further down in the same file, remove the old inline invite form call — it now lives in the new panel above. Replace:

```tsx
            </div>
          ))}
          {isAdmin && <InviteForm groupId={membership.groupId} />}
        </div>
      </div>
```

With:

```tsx
            </div>
          ))}
        </div>
      </div>
```

- [ ] **Step 3: Add CSS**

In `src/app/globals.css`, replace:

```css
.field input {
  width: 100%;
  min-width: 0;
  font-size: 15px;
  padding: 11px 12px;
  border: 1px solid var(--rule-strong);
  border-radius: 8px;
  background: var(--paper);
  color: var(--ink);
  font-family: inherit;
}

.field input:focus {
  outline: 2px solid var(--brass);
  outline-offset: 1px;
  border-color: var(--brass);
}
```

With:

```css
.field input,
.field select {
  width: 100%;
  min-width: 0;
  font-size: 15px;
  padding: 11px 12px;
  border: 1px solid var(--rule-strong);
  border-radius: 8px;
  background: var(--paper);
  color: var(--ink);
  font-family: inherit;
}

.field input:focus,
.field select:focus {
  outline: 2px solid var(--brass);
  outline-offset: 1px;
  border-color: var(--brass);
}
```

Then, right after the `.field-row` block (after the `@media (max-width: 480px) { .field-row { ... } }` rule), add:

```css
.inline-form-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.inline-form-row .field {
  flex: 1;
  min-width: 180px;
  margin-bottom: 0;
}

@media (max-width: 480px) {
  .inline-form-row {
    align-items: stretch;
  }
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, open `/dashboard/pessoas` as an admin. Confirm the invite form now sits in its own panel titled "Convidar alguém da equipe" with the subtitle, e-mail/função/button laid out in one row on desktop and stacked on narrow widths, and the select looks consistent with the text input.
Expected: no visual regressions, no console errors, generating an invite still works and shows the link.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/pessoas/InviteForm.tsx src/app/dashboard/pessoas/page.tsx src/app/globals.css
git commit -m "feat: give the invite form its own panel with inline layout"
```

---

### Task 8: Pessoas — split into "Ativos" and "Convites pendentes", both paginated

**Files:**
- Create: `src/app/dashboard/pessoas/CopyInviteLinkButton.tsx`
- Modify: `src/app/dashboard/pessoas/page.tsx`

**Interfaces:**
- Consumes: `listPendingInvites` (Task 5), `daysAgoLabel` (Task 6), `ROLE_LABEL` (already exported from `@/components/RoleBadge`).
- Produces: `CopyInviteLinkButton` component (`{ inviteId: string }`).

- [ ] **Step 1: Write `src/app/dashboard/pessoas/CopyInviteLinkButton.tsx`**

```tsx
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
```

- [ ] **Step 2: Rewrite `src/app/dashboard/pessoas/page.tsx`**

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  listMembers,
  listPendingInvites,
  getStoreAssignmentIds,
} from "@/server/services/membershipService";
import { listStores } from "@/server/services/groupService";
import { RoleBadge, ROLE_LABEL } from "@/components/RoleBadge";
import { daysAgoLabel } from "@/lib/relativeTime";
import { InviteForm } from "./InviteForm";
import { StoreAssignmentControl } from "./StoreAssignmentControl";
import { CopyInviteLinkButton } from "./CopyInviteLinkButton";

const PAGE_SIZE = 5;

function paginate<T>(items: T[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = items.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, items.length);
  return { pageItems, page, totalPages, rangeStart, rangeEnd };
}

export default async function PessoasPage({
  searchParams,
}: {
  searchParams: { ativosPage?: string; pendentesPage?: string };
}) {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({ where: { userId: session.userId } });
  if (!membership) redirect("/login");

  const isAdmin = membership.role === "admin";

  const [members, pendingInvites, stores] = await Promise.all([
    listMembers(membership.groupId),
    isAdmin ? listPendingInvites(membership.groupId) : Promise.resolve([]),
    listStores(membership.groupId),
  ]);

  const assignmentsByMembership = isAdmin
    ? Object.fromEntries(
        await Promise.all(
          members
            .filter((m) => m.role !== "admin")
            .map(async (m) => [m.id, await getStoreAssignmentIds(m.id)] as const)
        )
      )
    : {};

  const ativos = paginate(members, parseInt(searchParams.ativosPage ?? "1", 10) || 1);
  const pendentes = paginate(pendingInvites, parseInt(searchParams.pendentesPage ?? "1", 10) || 1);

  return (
    <>
      <div className="context-line">
        <span className="k">Grupo</span>
        <h1>Pessoas com acesso</h1>
      </div>

      {isAdmin && (
        <div className="panel">
          <div className="panel-head">
            <h2>Convidar alguém da equipe</h2>
            <div className="panel-head-sub">
              Você recebe um link pra compartilhar por WhatsApp ou e-mail — sem envio automático nesta
              versão
            </div>
          </div>
          <div className="panel-body">
            <InviteForm groupId={membership.groupId} />
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <h2>Ativos</h2>
        </div>
        <div className="panel-body">
          {ativos.pageItems.map((m) => (
            <div key={m.id}>
              <div className="list-row">
                <div className="list-row-main">{m.email}</div>
                <RoleBadge role={m.role} />
              </div>
              {isAdmin && m.role !== "admin" && (
                <StoreAssignmentControl
                  membershipId={m.id}
                  groupStores={stores}
                  initialStoreIds={assignmentsByMembership[m.id] ?? []}
                />
              )}
            </div>
          ))}
        </div>
        <div className="pager">
          <div className="pager-range">
            Mostrando <b>{ativos.rangeStart}–{ativos.rangeEnd}</b> de <b>{members.length}</b>
          </div>
          <div className="pager-btns">
            {ativos.page <= 1 ? (
              <button className="btn btn-ghost btn-sm" disabled>
                Anterior
              </button>
            ) : (
              <Link href={`/dashboard/pessoas?ativosPage=${ativos.page - 1}`} className="btn btn-ghost btn-sm">
                Anterior
              </Link>
            )}
            {ativos.page >= ativos.totalPages ? (
              <button className="btn btn-ghost btn-sm" disabled>
                Próxima
              </button>
            ) : (
              <Link href={`/dashboard/pessoas?ativosPage=${ativos.page + 1}`} className="btn btn-ghost btn-sm">
                Próxima
              </Link>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="panel">
          <div className="panel-head">
            <h2>Convites pendentes</h2>
          </div>
          <div className="panel-body">
            {pendentes.pageItems.length === 0 ? (
              <p className="list-empty">Nenhum convite pendente.</p>
            ) : (
              pendentes.pageItems.map((invite) => (
                <div className="list-row" key={invite.id}>
                  <div>
                    <div className="list-row-main">{invite.email}</div>
                    <div className="list-row-sub">
                      {ROLE_LABEL[invite.role]} · {daysAgoLabel(invite.createdAt)}
                    </div>
                  </div>
                  <span className="pill brass">Aguardando aceite</span>
                  <CopyInviteLinkButton inviteId={invite.id} />
                </div>
              ))
            )}
          </div>
          <div className="pager">
            <div className="pager-range">
              Mostrando <b>{pendentes.rangeStart}–{pendentes.rangeEnd}</b> de <b>{pendingInvites.length}</b>
            </div>
            <div className="pager-btns">
              {pendentes.page <= 1 ? (
                <button className="btn btn-ghost btn-sm" disabled>
                  Anterior
                </button>
              ) : (
                <Link
                  href={`/dashboard/pessoas?pendentesPage=${pendentes.page - 1}`}
                  className="btn btn-ghost btn-sm"
                >
                  Anterior
                </Link>
              )}
              {pendentes.page >= pendentes.totalPages ? (
                <button className="btn btn-ghost btn-sm" disabled>
                  Próxima
                </button>
              ) : (
                <Link
                  href={`/dashboard/pessoas?pendentesPage=${pendentes.page + 1}`}
                  className="btn btn-ghost btn-sm"
                >
                  Próxima
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, open `/dashboard/pessoas` as an admin with more than 5 members and more than 5 pending invites (generate a handful of invites via the form to get there). Confirm "Ativos" and "Convites pendentes" paginate independently (`?ativosPage=2` doesn't affect the pending list and vice versa), each pending row shows role, "convidado há N dias", the "Aguardando aceite" pill, and a working "Copiar link" button (paste it somewhere to confirm it's `/join/<id>`). Confirm a non-admin (operator/support) sees no invite panel and no pending-invites panel.
Expected: both lists paginate correctly, copy button works, role gating unchanged, no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/pessoas/CopyInviteLinkButton.tsx src/app/dashboard/pessoas/page.tsx
git commit -m "feat: split Pessoas into paginated Ativos and Convites pendentes"
```

---

### Task 9: Restyle store-restriction control as Katalagge chips

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- No new interfaces — CSS-only change; `StoreAssignmentControl.tsx` markup is unchanged.

- [ ] **Step 1: Replace the CSS**

Replace:

```css
.store-assignment-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: var(--ink);
}
```

With:

```css
.store-assignment-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-muted);
  background: var(--surface);
  border: 1px solid var(--rule-strong);
  border-radius: 999px;
  padding: 5px 12px 5px 10px;
  cursor: pointer;
}

.store-assignment-item:has(input:checked) {
  background: var(--brass-soft);
  border-color: var(--brass);
  color: var(--brass-ink);
  font-weight: 600;
}

.store-assignment-item input {
  accent-color: var(--brass);
}
```

- [ ] **Step 2: Verify manually**

Run: `npm run dev`, open `/dashboard/pessoas` as an admin, confirm the store checkboxes under an operator/support member now render as pill-shaped chips that highlight brass when checked, and toggling/saving still works exactly as before.
Expected: visual style matches the rest of the Katalagge pill system, no functional change, no console errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: restyle store-restriction control as selectable chips"
```

---

### Task 10: End-to-end verification

**Files:**
- None (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all test files pass, including the new `subscriptionStatus.test.ts`, `relativeTime.test.ts`, and the extended `membershipService.test.ts`.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual walkthrough**

With `docker compose up -d postgres` and `npm run dev` running, as an admin:
1. `/dashboard` — confirm topbar shows the subscription-status pill; scoreboard shows illustrative numbers with the example note; trend chart renders with its example note; ledger rows and rail store rows navigate to `/dashboard/lojas/[id]`.
2. `/dashboard/pessoas` — confirm the title is "Pessoas com acesso"; the invite panel has its subtitle and inline layout; "Ativos" and "Convites pendentes" both paginate independently; "Copiar link" works; store-restriction chips render and function.
3. Log in as a restricted operator (has `MembershipStore` rows) — confirm the rail, `/dashboard` ledger, and `/dashboard/lojas/[id]` only show/allow their assigned stores.

Expected: every step behaves as described, no unhandled errors in the server console or browser devtools.

- [ ] **Step 4: Commit the plan checklist as done**

```bash
git add docs/superpowers/plans/2026-09-12-katalagge-ui-completion.md
git commit -m "docs: mark Katalagge UI completion (Visão do grupo + Pessoas) plan done"
```
