# Fundação Multi-tenant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a person sign up, create their group (franchise), add stores, and invite operator/support teammates — the multi-tenant backbone every later subsystem (ingestion, reconciliation, ticketing, billing) builds on.

**Architecture:** A single Next.js (TypeScript, App Router) app with in-app auth (JWT session cookie, no third-party auth vendor) and Postgres via Prisma. No background worker or queue in this plan — those arrive in the reconciliation-engine plan once there's real data to process asynchronously. Invites skip email infrastructure: an admin generates a link and shares it manually (WhatsApp/email), matching the "keep it simple" constraint.

**Tech Stack:** Next.js 14 (App Router) + TypeScript, Prisma + PostgreSQL, bcryptjs (password hashing), jose (JWT sessions), zod (input validation), Vitest (tests).

This is plan 1 of 5 for the sales-reconciliation SaaS described in `docs/superpowers/specs/2026-08-21-conciliacao-saas-design.md`. It implements design doc §3 (multi-tenant model and roles) end to end. Ingestion (§4), reconciliation (§5), ticketing (§6), and billing (§7) are separate follow-up plans that build on the `groups`/`stores`/`memberships` tables created here.

## Global Constraints

- All application code is TypeScript — no `.js` source files.
- Every business table is isolated by `groupId`; no query in this plan reads across groups.
- Only three roles exist: `admin`, `operator`, `support` — no other role is introduced.
- Auth is implemented in-app (no Clerk/Cognito/Supabase Auth) for this phase, per design doc §8.
- No transactional email provider in this phase — invites are shared as a manually-copied link.
- Tests that touch the database run against a real local Postgres instance, never a mock.

---

### Task 1: Project scaffold, schema, and local database

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `prisma/schema.prisma`

**Interfaces:**
- Produces: Prisma models `User`, `Group`, `Store`, `Membership`, `PendingMembership` — every later task imports the generated `@prisma/client` types from these.
- Produces: path alias `@/*` → `src/*`, used by every subsequent import.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "conciliacao-vendas",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@prisma/client": "^5.18.0",
    "bcryptjs": "^2.4.3",
    "jose": "^5.6.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "dotenv": "^16.4.5",
    "prisma": "^5.18.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Write `vitest.config.ts` and `tests/setup.ts`**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

`tests/setup.ts`:

```ts
import { config } from "dotenv";

config({ path: ".env.test" });
```

- [ ] **Step 5: Write `docker-compose.yml`, `.env.example`, `.gitignore`**

`docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: conciliacao
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

`.env.example`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/conciliacao?schema=public"
SESSION_JWT_SECRET="change-me-to-a-random-32-byte-string"
```

`.gitignore`:

```
node_modules
.next
.env
.env.test
```

Then create `.env` and `.env.test` locally (not committed — they're in `.gitignore`):

`.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/conciliacao?schema=public"
SESSION_JWT_SECRET="dev-only-secret-change-before-deploy-32b"
```

`.env.test`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/conciliacao_test?schema=public"
SESSION_JWT_SECRET="test-secret-at-least-32-bytes-long!!"
```

- [ ] **Step 6: Write `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String       @id @default(cuid())
  email        String       @unique
  passwordHash String
  createdAt    DateTime     @default(now())
  memberships  Membership[]
}

model Group {
  id                 String              @id @default(cuid())
  name               String
  subscriptionStatus String              @default("trialing")
  createdAt          DateTime            @default(now())
  stores             Store[]
  memberships        Membership[]
  pendingMemberships PendingMembership[]
}

model Store {
  id        String   @id @default(cuid())
  groupId   String
  group     Group    @relation(fields: [groupId], references: [id])
  name      String
  code      String
  createdAt DateTime @default(now())

  @@unique([groupId, code])
}

model Membership {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  groupId   String
  group     Group    @relation(fields: [groupId], references: [id])
  role      String
  createdAt DateTime @default(now())

  @@unique([userId, groupId])
}

model PendingMembership {
  id        String   @id @default(cuid())
  groupId   String
  group     Group    @relation(fields: [groupId], references: [id])
  email     String
  role      String
  createdAt DateTime @default(now())

  @@unique([groupId, email])
}
```

- [ ] **Step 7: Install, start Postgres, run migration**

Run:
```bash
npm install
docker compose up -d postgres
docker compose exec postgres createdb -U postgres conciliacao_test
npx prisma migrate dev --name init
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/conciliacao_test?schema=public" npx prisma migrate deploy
```
Expected: migration creates `User`, `Group`, `Store`, `Membership`, `PendingMembership` tables in both `conciliacao` and `conciliacao_test` databases; Prisma Client is generated into `node_modules/@prisma/client`.

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json next.config.ts vitest.config.ts tests/setup.ts docker-compose.yml .env.example .gitignore prisma package-lock.json
git commit -m "chore: scaffold Next.js app with Prisma schema for multi-tenant core"
```

---

### Task 2: Password hashing utility

**Files:**
- Create: `src/lib/auth/password.ts`
- Test: `src/lib/auth/password.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain: string, hash: string): Promise<boolean>` — used by `authService` (Task 4, 5, 7).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth/password.test.ts`
Expected: FAIL — `Cannot find module './password'`

- [ ] **Step 3: Write the implementation**

```ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/auth/password.test.ts`
Expected: `Test Files  1 passed (1)`, `Tests  2 passed (2)`

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/password.ts src/lib/auth/password.test.ts
git commit -m "feat: add password hashing utility"
```

---

### Task 3: Session utility (JWT cookie)

**Files:**
- Create: `src/lib/auth/session.ts`
- Test: `src/lib/auth/session.test.ts`

**Interfaces:**
- Produces: `SESSION_COOKIE_NAME: string`, `SessionPayload = { userId: string; email: string }`, `createSessionToken(payload: SessionPayload): Promise<string>`, `verifySessionToken(token: string): Promise<SessionPayload | null>`, `getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null>` — used by every API route and the middleware (Tasks 9–12).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import {
  createSessionToken,
  verifySessionToken,
  getSessionFromRequest,
  SESSION_COOKIE_NAME,
} from "./session";

beforeAll(() => {
  process.env.SESSION_JWT_SECRET = "test-secret-at-least-32-bytes-long!!";
});

describe("session", () => {
  it("round-trips a valid payload", async () => {
    const token = await createSessionToken({ userId: "user_1", email: "a@b.com" });
    expect(await verifySessionToken(token)).toEqual({ userId: "user_1", email: "a@b.com" });
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken({ userId: "user_1", email: "a@b.com" });
    const tampered = token.slice(0, -2) + "xx";
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("reads a valid session from the request cookie", async () => {
    const token = await createSessionToken({ userId: "user_1", email: "a@b.com" });
    const req = new NextRequest("http://localhost/dashboard", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    expect(await getSessionFromRequest(req)).toEqual({ userId: "user_1", email: "a@b.com" });
  });

  it("returns null when there is no cookie", async () => {
    const req = new NextRequest("http://localhost/dashboard");
    expect(await getSessionFromRequest(req)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth/session.test.ts`
Expected: FAIL — `Cannot find module './session'`

- [ ] **Step 3: Write the implementation**

```ts
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) throw new Error("SESSION_JWT_SECRET is not set");
  return encoder.encode(secret);
}

export const SESSION_COOKIE_NAME = "session";

export type SessionPayload = {
  userId: string;
  email: string;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") return null;
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/auth/session.test.ts`
Expected: `Test Files  1 passed (1)`, `Tests  4 passed (4)`

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/session.ts src/lib/auth/session.test.ts
git commit -m "feat: add JWT session cookie utilities"
```

---

### Task 4: AuthService — signup

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/server/services/authService.ts`
- Test: `src/server/services/authService.test.ts`
- Create: `tests/helpers/resetDb.ts`

**Interfaces:**
- Consumes: `hashPassword` from `@/lib/auth/password` (Task 2).
- Produces: `db` (Prisma client singleton) — used by every service from here on. `AuthError` (class, `code: "EMAIL_TAKEN" | "INVALID_CREDENTIALS" | "INVITE_NOT_FOUND"`), `SignupInput = { email: string; password: string; groupName: string }`, `SignupResult = { userId: string; groupId: string }`, `signup(input: SignupInput): Promise<SignupResult>` — used by the signup API route (Task 9).

- [ ] **Step 1: Write `src/lib/db.ts`**

```ts
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const db = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = db;
}
```

- [ ] **Step 2: Write `tests/helpers/resetDb.ts`**

```ts
import { db } from "@/lib/db";

export async function resetDb() {
  await db.pendingMembership.deleteMany();
  await db.membership.deleteMany();
  await db.store.deleteMany();
  await db.group.deleteMany();
  await db.user.deleteMany();
}
```

- [ ] **Step 3: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { resetDb } from "../../../tests/helpers/resetDb";
import { signup } from "./authService";

describe("authService.signup", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a user, a group, and an admin membership", async () => {
    const result = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const membership = await db.membership.findUnique({
      where: { userId_groupId: { userId: result.userId, groupId: result.groupId } },
    });
    expect(membership?.role).toBe("admin");

    const group = await db.group.findUnique({ where: { id: result.groupId } });
    expect(group?.name).toBe("Franquia Norte");
  });

  it("throws EMAIL_TAKEN for a duplicate email", async () => {
    await signup({ email: "admin@franquia.com", password: "supersecret1", groupName: "Franquia Norte" });

    await expect(
      signup({ email: "admin@franquia.com", password: "another1234", groupName: "Outra Franquia" })
    ).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/server/services/authService.test.ts`
Expected: FAIL — `Cannot find module './authService'`

- [ ] **Step 5: Write the implementation**

```ts
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

export class AuthError extends Error {
  code: "EMAIL_TAKEN" | "INVALID_CREDENTIALS" | "INVITE_NOT_FOUND";
  constructor(code: AuthError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export type SignupInput = { email: string; password: string; groupName: string };
export type SignupResult = { userId: string; groupId: string };

export async function signup(input: SignupInput): Promise<SignupResult> {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AuthError("EMAIL_TAKEN", `Email ${input.email} is already registered`);

  const passwordHash = await hashPassword(input.password);

  return db.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email: input.email, passwordHash } });
    const group = await tx.group.create({ data: { name: input.groupName } });
    await tx.membership.create({
      data: { userId: user.id, groupId: group.id, role: "admin" },
    });
    return { userId: user.id, groupId: group.id };
  });
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/server/services/authService.test.ts`
Expected: `Test Files  1 passed (1)`, `Tests  2 passed (2)`

- [ ] **Step 7: Commit**

```bash
git add src/lib/db.ts src/server/services/authService.ts src/server/services/authService.test.ts tests/helpers/resetDb.ts
git commit -m "feat: add signup to authService"
```

---

### Task 5: AuthService — login

**Files:**
- Modify: `src/server/services/authService.ts`
- Modify: `src/server/services/authService.test.ts`

**Interfaces:**
- Produces: `LoginInput = { email: string; password: string }`, `LoginResult = { userId: string; email: string }`, `login(input: LoginInput): Promise<LoginResult>` — used by the login API route (Task 9).

- [ ] **Step 1: Add the failing test**

Append to `src/server/services/authService.test.ts`:

```ts
import { login } from "./authService";

describe("authService.login", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns the user for correct credentials", async () => {
    await signup({ email: "admin@franquia.com", password: "supersecret1", groupName: "Franquia Norte" });

    const result = await login({ email: "admin@franquia.com", password: "supersecret1" });
    expect(result.email).toBe("admin@franquia.com");
  });

  it("throws INVALID_CREDENTIALS for a wrong password", async () => {
    await signup({ email: "admin@franquia.com", password: "supersecret1", groupName: "Franquia Norte" });

    await expect(
      login({ email: "admin@franquia.com", password: "wrong-password" })
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("throws INVALID_CREDENTIALS for an unknown email", async () => {
    await expect(
      login({ email: "nobody@nowhere.com", password: "whatever1" })
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/services/authService.test.ts`
Expected: FAIL — `login is not a function` / `Cannot find name 'login'`

- [ ] **Step 3: Add the implementation**

Append to `src/server/services/authService.ts`:

```ts
import { verifyPassword } from "@/lib/auth/password";

export type LoginInput = { email: string; password: string };
export type LoginResult = { userId: string; email: string };

export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");

  return { userId: user.id, email: user.email };
}
```

(Update the top import line to `import { hashPassword, verifyPassword } from "@/lib/auth/password";`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/server/services/authService.test.ts`
Expected: `Test Files  1 passed (1)`, `Tests  5 passed (5)`

- [ ] **Step 5: Commit**

```bash
git add src/server/services/authService.ts src/server/services/authService.test.ts
git commit -m "feat: add login to authService"
```

---

### Task 6: MembershipService

**Files:**
- Create: `src/server/services/membershipService.ts`
- Test: `src/server/services/membershipService.test.ts`

**Interfaces:**
- Produces: `MemberRole = "admin" | "operator" | "support"`, `getMembershipRole(userId, groupId): Promise<MemberRole | null>`, `MemberSummary = { id: string; email: string; role: MemberRole }`, `listMembers(groupId): Promise<MemberSummary[]>`, `InviteInput = { email: string; role: MemberRole }`, `InviteResult = { id: string; email: string; role: MemberRole }`, `inviteMember(groupId, input: InviteInput): Promise<InviteResult>`, `InvitePreview = { email: string; role: MemberRole; groupName: string }`, `getInvitePreview(id): Promise<InvitePreview | null>` — used by the stores/invites API routes (Tasks 10, 11) and the `/join/[id]` page (Task 14).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { resetDb } from "../../../tests/helpers/resetDb";
import { signup } from "./authService";
import {
  getMembershipRole,
  listMembers,
  inviteMember,
  getInvitePreview,
} from "./membershipService";

describe("membershipService", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns the role for an existing membership and null otherwise", async () => {
    const { userId, groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    expect(await getMembershipRole(userId, groupId)).toBe("admin");
    expect(await getMembershipRole("nonexistent", groupId)).toBeNull();
  });

  it("lists members of a group", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const members = await listMembers(groupId);
    expect(members).toEqual([
      expect.objectContaining({ email: "admin@franquia.com", role: "admin" }),
    ]);
  });

  it("creates a pending membership and previews it", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });
    const preview = await getInvitePreview(invite.id);

    expect(preview).toEqual({
      email: "operador@franquia.com",
      role: "operator",
      groupName: "Franquia Norte",
    });
  });

  it("returns null preview for an unknown invite id", async () => {
    expect(await getInvitePreview("does-not-exist")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/services/membershipService.test.ts`
Expected: FAIL — `Cannot find module './membershipService'`

- [ ] **Step 3: Write the implementation**

```ts
import { db } from "@/lib/db";

export type MemberRole = "admin" | "operator" | "support";

export async function getMembershipRole(userId: string, groupId: string): Promise<MemberRole | null> {
  const membership = await db.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  return (membership?.role as MemberRole) ?? null;
}

export type MemberSummary = { id: string; email: string; role: MemberRole };

export async function listMembers(groupId: string): Promise<MemberSummary[]> {
  const memberships = await db.membership.findMany({
    where: { groupId },
    include: { user: true },
  });
  return memberships.map((m) => ({ id: m.id, email: m.user.email, role: m.role as MemberRole }));
}

export type InviteInput = { email: string; role: MemberRole };
export type InviteResult = { id: string; email: string; role: MemberRole };

export async function inviteMember(groupId: string, input: InviteInput): Promise<InviteResult> {
  const pending = await db.pendingMembership.create({
    data: { groupId, email: input.email, role: input.role },
  });
  return { id: pending.id, email: pending.email, role: pending.role as MemberRole };
}

export type InvitePreview = { email: string; role: MemberRole; groupName: string };

export async function getInvitePreview(id: string): Promise<InvitePreview | null> {
  const pending = await db.pendingMembership.findUnique({
    where: { id },
    include: { group: true },
  });
  if (!pending) return null;
  return { email: pending.email, role: pending.role as MemberRole, groupName: pending.group.name };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/server/services/membershipService.test.ts`
Expected: `Test Files  1 passed (1)`, `Tests  4 passed (4)`

- [ ] **Step 5: Commit**

```bash
git add src/server/services/membershipService.ts src/server/services/membershipService.test.ts
git commit -m "feat: add membershipService for roles, member listing, and invites"
```

---

### Task 7: AuthService — acceptInvite

**Files:**
- Modify: `src/server/services/authService.ts`
- Modify: `src/server/services/authService.test.ts`

**Interfaces:**
- Consumes: `db.pendingMembership` (Task 1 schema).
- Produces: `AcceptInviteInput = { pendingMembershipId: string; password: string }`, `AcceptInviteResult = { userId: string; groupId: string; role: string }`, `acceptInvite(input: AcceptInviteInput): Promise<AcceptInviteResult>` — used by the accept-invite API route (Task 10).

- [ ] **Step 1: Add the failing test**

Append to `src/server/services/authService.test.ts`:

```ts
import { acceptInvite } from "./authService";
import { inviteMember } from "./membershipService";

describe("authService.acceptInvite", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a new user and attaches the invited role", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const invite = await inviteMember(groupId, { email: "operador@franquia.com", role: "operator" });

    const result = await acceptInvite({ pendingMembershipId: invite.id, password: "outrasenha1" });

    expect(result.groupId).toBe(groupId);
    expect(result.role).toBe("operator");

    const remaining = await db.pendingMembership.findUnique({ where: { id: invite.id } });
    expect(remaining).toBeNull();
  });

  it("throws INVITE_NOT_FOUND for an unknown invite", async () => {
    await expect(
      acceptInvite({ pendingMembershipId: "does-not-exist", password: "outrasenha1" })
    ).rejects.toMatchObject({ code: "INVITE_NOT_FOUND" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/services/authService.test.ts`
Expected: FAIL — `acceptInvite is not a function`

- [ ] **Step 3: Add the implementation**

Append to `src/server/services/authService.ts`:

```ts
export type AcceptInviteInput = { pendingMembershipId: string; password: string };
export type AcceptInviteResult = { userId: string; groupId: string; role: string };

export async function acceptInvite(input: AcceptInviteInput): Promise<AcceptInviteResult> {
  const pending = await db.pendingMembership.findUnique({ where: { id: input.pendingMembershipId } });
  if (!pending) throw new AuthError("INVITE_NOT_FOUND", "Invite not found");

  const passwordHash = await hashPassword(input.password);

  return db.$transaction(async (tx) => {
    let user = await tx.user.findUnique({ where: { email: pending.email } });
    if (!user) {
      user = await tx.user.create({ data: { email: pending.email, passwordHash } });
    }
    await tx.membership.create({
      data: { userId: user.id, groupId: pending.groupId, role: pending.role },
    });
    await tx.pendingMembership.delete({ where: { id: pending.id } });
    return { userId: user.id, groupId: pending.groupId, role: pending.role };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/server/services/authService.test.ts`
Expected: `Test Files  1 passed (1)`, `Tests  7 passed (7)`

- [ ] **Step 5: Commit**

```bash
git add src/server/services/authService.ts src/server/services/authService.test.ts
git commit -m "feat: add acceptInvite to authService"
```

---

### Task 8: GroupService — stores

**Files:**
- Create: `src/server/services/groupService.ts`
- Test: `src/server/services/groupService.test.ts`

**Interfaces:**
- Produces: `StoreSummary = { id: string; name: string; code: string }`, `listStores(groupId): Promise<StoreSummary[]>`, `CreateStoreInput = { name: string; code: string }`, `createStore(groupId, input: CreateStoreInput): Promise<StoreSummary>` — used by the stores API route (Task 11) and the dashboard page (Task 15).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "../../../tests/helpers/resetDb";
import { signup } from "./authService";
import { createStore, listStores } from "./groupService";

describe("groupService", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a store and lists it back", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const store = await createStore(groupId, { name: "Loja Centro", code: "CTR" });
    expect(store).toEqual({ id: expect.any(String), name: "Loja Centro", code: "CTR" });

    const stores = await listStores(groupId);
    expect(stores).toEqual([{ id: store.id, name: "Loja Centro", code: "CTR" }]);
  });

  it("only returns stores for the given group", async () => {
    const groupA = await signup({ email: "a@x.com", password: "supersecret1", groupName: "A" });
    const groupB = await signup({ email: "b@x.com", password: "supersecret1", groupName: "B" });

    await createStore(groupA.groupId, { name: "Loja A", code: "A1" });
    await createStore(groupB.groupId, { name: "Loja B", code: "B1" });

    const storesA = await listStores(groupA.groupId);
    expect(storesA).toHaveLength(1);
    expect(storesA[0].name).toBe("Loja A");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/services/groupService.test.ts`
Expected: FAIL — `Cannot find module './groupService'`

- [ ] **Step 3: Write the implementation**

```ts
import { db } from "@/lib/db";

export type StoreSummary = { id: string; name: string; code: string };

export async function listStores(groupId: string): Promise<StoreSummary[]> {
  const stores = await db.store.findMany({ where: { groupId }, orderBy: { name: "asc" } });
  return stores.map((s) => ({ id: s.id, name: s.name, code: s.code }));
}

export type CreateStoreInput = { name: string; code: string };

export async function createStore(groupId: string, input: CreateStoreInput): Promise<StoreSummary> {
  const store = await db.store.create({ data: { groupId, name: input.name, code: input.code } });
  return { id: store.id, name: store.name, code: store.code };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/server/services/groupService.test.ts`
Expected: `Test Files  1 passed (1)`, `Tests  2 passed (2)`

- [ ] **Step 5: Commit**

```bash
git add src/server/services/groupService.ts src/server/services/groupService.test.ts
git commit -m "feat: add groupService for store creation and listing"
```

---

### Task 9: API routes — signup, login, logout

**Files:**
- Create: `src/app/api/auth/signup/route.ts`
- Test: `src/app/api/auth/signup/route.test.ts`
- Create: `src/app/api/auth/login/route.ts`
- Test: `src/app/api/auth/login/route.test.ts`
- Create: `src/app/api/auth/logout/route.ts`

**Interfaces:**
- Consumes: `signup`, `login`, `AuthError` from `@/server/services/authService` (Tasks 4, 5); `createSessionToken`, `SESSION_COOKIE_NAME` from `@/lib/auth/session` (Task 3).
- Produces: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout` — used by the signup/login pages (Task 13).

- [ ] **Step 1: Write the failing tests**

`src/app/api/auth/signup/route.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../../tests/helpers/resetDb";
import { POST } from "./route";

function jsonRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a user and a group, and sets a session cookie", async () => {
    const res = await POST(
      jsonRequest({ email: "admin@franquia.com", password: "supersecret1", groupName: "Franquia Norte" })
    );
    expect(res.status).toBe(201);
    expect(res.headers.get("set-cookie")).toContain("session=");
  });

  it("rejects a duplicate email with 409", async () => {
    await POST(jsonRequest({ email: "admin@franquia.com", password: "supersecret1", groupName: "Franquia Norte" }));
    const res = await POST(jsonRequest({ email: "admin@franquia.com", password: "another1234", groupName: "Outra" }));
    expect(res.status).toBe(409);
  });

  it("rejects invalid input with 400", async () => {
    const res = await POST(jsonRequest({ email: "not-an-email", password: "short", groupName: "" }));
    expect(res.status).toBe(400);
  });
});
```

`src/app/api/auth/login/route.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../../tests/helpers/resetDb";
import { POST as signupPOST } from "../signup/route";
import { POST } from "./route";

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await resetDb();
    await signupPOST(
      jsonRequest("http://localhost/api/auth/signup", {
        email: "admin@franquia.com",
        password: "supersecret1",
        groupName: "Franquia Norte",
      })
    );
  });

  it("logs in with correct credentials and sets a session cookie", async () => {
    const res = await POST(
      jsonRequest("http://localhost/api/auth/login", { email: "admin@franquia.com", password: "supersecret1" })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("session=");
  });

  it("rejects a wrong password with 401", async () => {
    const res = await POST(
      jsonRequest("http://localhost/api/auth/login", { email: "admin@franquia.com", password: "wrong-password" })
    );
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/api/auth`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Write the implementations**

`src/app/api/auth/signup/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signup, AuthError } from "@/server/services/authService";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  groupName: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    const result = await signup(parsed.data);
    const token = await createSessionToken({ userId: result.userId, email: parsed.data.email });
    const response = NextResponse.json({ groupId: result.groupId }, { status: 201 });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err) {
    if (err instanceof AuthError && err.code === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    }
    throw err;
  }
}
```

`src/app/api/auth/login/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { login, AuthError } from "@/server/services/authService";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    const result = await login(parsed.data);
    const token = await createSessionToken(result);
    const response = NextResponse.json({ userId: result.userId }, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err) {
    if (err instanceof AuthError && err.code === "INVALID_CREDENTIALS") {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    throw err;
  }
}
```

`src/app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/api/auth`
Expected: `Test Files  2 passed (2)`, `Tests  5 passed (5)`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth
git commit -m "feat: add signup, login, and logout API routes"
```

---

### Task 10: API routes — invites

**Files:**
- Create: `src/app/api/invites/route.ts`
- Create: `src/app/api/invites/[id]/route.ts`
- Create: `src/app/api/invites/[id]/accept/route.ts`
- Test: `src/app/api/invites/route.test.ts`
- Test: `src/app/api/invites/[id]/accept/route.test.ts`

**Interfaces:**
- Consumes: `getSessionFromRequest` (Task 3); `getMembershipRole`, `inviteMember`, `getInvitePreview` (Task 6); `acceptInvite`, `AuthError` (Task 7); `db` (Task 4).
- Produces: `POST /api/invites`, `GET /api/invites/[id]`, `POST /api/invites/[id]/accept` — used by the invite form and `/join/[id]` page (Tasks 14, 15).

- [ ] **Step 1: Write the failing tests**

`src/app/api/invites/route.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../tests/helpers/resetDb";
import { signup } from "@/server/services/authService";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { POST } from "./route";

async function authedRequest(userId: string, body: unknown) {
  const token = await createSessionToken({ userId, email: "admin@franquia.com" });
  return new NextRequest("http://localhost/api/invites", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `${SESSION_COOKIE_NAME}=${token}` },
    body: JSON.stringify(body),
  });
}

describe("POST /api/invites", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("lets an admin create an invite", async () => {
    const { userId, groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const res = await POST(await authedRequest(userId, { groupId, email: "op@franquia.com", role: "operator" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.email).toBe("op@franquia.com");
  });

  it("rejects an unauthenticated request with 401", async () => {
    const req = new NextRequest("http://localhost/api/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ groupId: "g1", email: "op@franquia.com", role: "operator" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
```

`src/app/api/invites/[id]/accept/route.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../../../tests/helpers/resetDb";
import { signup } from "@/server/services/authService";
import { inviteMember } from "@/server/services/membershipService";
import { POST } from "./route";

describe("POST /api/invites/[id]/accept", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("accepts a valid invite and sets a session cookie", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const invite = await inviteMember(groupId, { email: "op@franquia.com", role: "operator" });

    const req = new NextRequest(`http://localhost/api/invites/${invite.id}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "outrasenha1" }),
    });
    const res = await POST(req, { params: { id: invite.id } });

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("session=");
  });

  it("returns 404 for an unknown invite", async () => {
    const req = new NextRequest("http://localhost/api/invites/does-not-exist/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "outrasenha1" }),
    });
    const res = await POST(req, { params: { id: "does-not-exist" } });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/api/invites`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Write the implementations**

`src/app/api/invites/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getMembershipRole, inviteMember } from "@/server/services/membershipService";

const inviteSchema = z.object({
  groupId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["operator", "support"]),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const role = await getMembershipRole(session.userId, parsed.data.groupId);
  if (role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const invite = await inviteMember(parsed.data.groupId, { email: parsed.data.email, role: parsed.data.role });
  return NextResponse.json(invite, { status: 201 });
}
```

`src/app/api/invites/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getInvitePreview } from "@/server/services/membershipService";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const invite = await getInvitePreview(params.id);
  if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(invite, { status: 200 });
}
```

`src/app/api/invites/[id]/accept/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { acceptInvite, AuthError } from "@/server/services/authService";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const acceptSchema = z.object({ password: z.string().min(8) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  try {
    const result = await acceptInvite({ pendingMembershipId: params.id, password: parsed.data.password });
    const user = await db.user.findUniqueOrThrow({ where: { id: result.userId } });
    const token = await createSessionToken({ userId: result.userId, email: user.email });
    const response = NextResponse.json({ groupId: result.groupId, role: result.role }, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err) {
    if (err instanceof AuthError && err.code === "INVITE_NOT_FOUND") {
      return NextResponse.json({ error: "INVITE_NOT_FOUND" }, { status: 404 });
    }
    throw err;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/api/invites`
Expected: `Test Files  2 passed (2)`, `Tests  4 passed (4)`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/invites
git commit -m "feat: add invite creation, preview, and acceptance API routes"
```

---

### Task 11: API routes — stores

**Files:**
- Create: `src/app/api/stores/route.ts`
- Test: `src/app/api/stores/route.test.ts`

**Interfaces:**
- Consumes: `getSessionFromRequest` (Task 3); `getMembershipRole` (Task 6); `createStore`, `listStores` (Task 8).
- Produces: `GET /api/stores?groupId=...`, `POST /api/stores` — used by the dashboard's store form (Task 15).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../../../../tests/helpers/resetDb";
import { signup } from "@/server/services/authService";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { GET, POST } from "./route";

async function authedGet(userId: string, groupId: string) {
  const token = await createSessionToken({ userId, email: "admin@franquia.com" });
  return new NextRequest(`http://localhost/api/stores?groupId=${groupId}`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
  });
}

async function authedPost(userId: string, body: unknown) {
  const token = await createSessionToken({ userId, email: "admin@franquia.com" });
  return new NextRequest("http://localhost/api/stores", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `${SESSION_COOKIE_NAME}=${token}` },
    body: JSON.stringify(body),
  });
}

describe("stores API", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates and lists a store for the caller's group", async () => {
    const { userId, groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });

    const createRes = await POST(await authedPost(userId, { groupId, name: "Loja Centro", code: "CTR" }));
    expect(createRes.status).toBe(201);

    const listRes = await GET(await authedGet(userId, groupId));
    expect(listRes.status).toBe(200);
    const stores = await listRes.json();
    expect(stores).toEqual([{ id: expect.any(String), name: "Loja Centro", code: "CTR" }]);
  });

  it("rejects an unauthenticated request with 401", async () => {
    const req = new NextRequest("http://localhost/api/stores?groupId=g1");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/stores`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Write the implementation**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getMembershipRole } from "@/server/services/membershipService";
import { createStore, listStores } from "@/server/services/groupService";

const createStoreSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const groupId = req.nextUrl.searchParams.get("groupId");
  if (!groupId) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const role = await getMembershipRole(session.userId, groupId);
  if (!role) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const stores = await listStores(groupId);
  return NextResponse.json(stores, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json();
  const parsed = createStoreSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const role = await getMembershipRole(session.userId, parsed.data.groupId);
  if (role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const store = await createStore(parsed.data.groupId, { name: parsed.data.name, code: parsed.data.code });
  return NextResponse.json(store, { status: 201 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/stores`
Expected: `Test Files  1 passed (1)`, `Tests  2 passed (2)`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/stores
git commit -m "feat: add stores API route"
```

---

### Task 12: Middleware for route protection

**Files:**
- Create: `src/middleware.ts`
- Test: `src/middleware.test.ts`

**Interfaces:**
- Consumes: `getSessionFromRequest` (Task 3).
- Produces: redirect-to-`/login` behavior for any unauthenticated request to `/dashboard/*`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { middleware } from "./middleware";

beforeAll(() => {
  process.env.SESSION_JWT_SECRET = "test-secret-at-least-32-bytes-long!!";
});

describe("middleware", () => {
  it("redirects to /login when there is no session", async () => {
    const req = new NextRequest("http://localhost/dashboard");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("passes through when the session is valid", async () => {
    const token = await createSessionToken({ userId: "user_1", email: "a@b.com" });
    const req = new NextRequest("http://localhost/dashboard", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/middleware.test.ts`
Expected: FAIL — `Cannot find module './middleware'`

- [ ] **Step 3: Write the implementation**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/middleware.test.ts`
Expected: `Test Files  1 passed (1)`, `Tests  2 passed (2)`

- [ ] **Step 5: Commit**

```bash
git add src/middleware.ts src/middleware.test.ts
git commit -m "feat: add auth middleware protecting /dashboard"
```

---

### Task 13: UI — signup and login pages

**Files:**
- Create: `src/app/signup/page.tsx`
- Create: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/signup`, `POST /api/auth/login` (Task 9).

- [ ] **Step 1: Write `src/app/signup/page.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, groupName }),
    });
    if (res.status === 201) {
      router.push("/dashboard");
      return;
    }
    if (res.status === 409) {
      setError("Esse e-mail já está cadastrado.");
      return;
    }
    setError("Não foi possível criar sua conta. Confira os dados e tente de novo.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Criar conta</h1>
      <label>
        Nome do grupo (franquia)
        <input value={groupName} onChange={(e) => setGroupName(e.target.value)} required minLength={2} />
      </label>
      <label>
        E-mail
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Senha
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Criar conta</button>
    </form>
  );
}
```

- [ ] **Step 2: Write `src/app/login/page.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.status === 200) {
      router.push("/dashboard");
      return;
    }
    setError("E-mail ou senha incorretos.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Entrar</h1>
      <label>
        E-mail
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Senha
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Entrar</button>
    </form>
  );
}
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, open `http://localhost:3000/signup`, submit the form.
Expected: redirected to `/dashboard` (a 404 is fine — the page doesn't exist until Task 15 — a browser `Set-Cookie: session=...` should be visible in dev tools).

- [ ] **Step 4: Commit**

```bash
git add src/app/signup src/app/login
git commit -m "feat: add signup and login pages"
```

---

### Task 14: UI — join/accept-invite page

**Files:**
- Create: `src/app/join/[id]/page.tsx`
- Create: `src/app/join/[id]/AcceptInviteForm.tsx`

**Interfaces:**
- Consumes: `getInvitePreview` (Task 6, called directly — server component); `POST /api/invites/[id]/accept` (Task 10).

- [ ] **Step 1: Write `src/app/join/[id]/AcceptInviteForm.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AcceptInviteForm({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/invites/${inviteId}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.status === 200) {
      router.push("/dashboard");
      return;
    }
    setError("Não foi possível aceitar o convite. Ele pode já ter sido usado.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Crie uma senha
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Entrar</button>
    </form>
  );
}
```

- [ ] **Step 2: Write `src/app/join/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getInvitePreview } from "@/server/services/membershipService";
import { AcceptInviteForm } from "./AcceptInviteForm";

export default async function JoinPage({ params }: { params: { id: string } }) {
  const invite = await getInvitePreview(params.id);
  if (!invite) notFound();

  return (
    <main>
      <h1>Entrar em {invite.groupName}</h1>
      <p>
        Convite para {invite.email} como {invite.role === "operator" ? "Operador" : "Atendimento"}.
      </p>
      <AcceptInviteForm inviteId={params.id} />
    </main>
  );
}
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, create an invite via `curl` against `/api/invites` (with a valid session cookie from a signed-up admin), open `http://localhost:3000/join/<invite-id>`.
Expected: page shows the invited email/role/group name; submitting a password redirects to `/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add src/app/join
git commit -m "feat: add invite acceptance page"
```

---

### Task 15: UI — dashboard (stores, members, forms)

> **Revisão (2026-09-12):** o escopo abaixo (uma página só, lista simples) foi a versão inicial, escrita antes do protótipo de UI existir. Está superada — segue o desenho real:
>
> - A "dashboard" corresponde a duas telas do protótipo (`docs/superpowers/specs/2026-09-08-katalagge-ui-design.md`), cada uma com sua rota: `/dashboard` = **"Visão do grupo"** ("Todas as lojas") e `/dashboard/pessoas` = **"Pessoas"**. Um `layout.tsx` compartilhado dá o topbar + rail lateral (menu com ícones, incluindo os itens de telas futuras — Inconsistências, Relatório, Enviar planilha, Fontes de dados, Faturas — desabilitados/"em breve" até os planos que os implementam existirem).
> - `/dashboard` segue o protótipo por completo: banner de status da assinatura, scoreboard de conciliação do mês, e a tabela "Como cada loja está" com paginação — não só a lista simples de nome/código.
> - **Sem dado real de conciliação/faturamento ainda** (isso é dos planos de ingestão/reconciliação/faturamento, não escritos): a estrutura visual é implementada de qualquer forma, mas com estado vazio honesto em vez de número fabricado — cada loja aparece como "sem fonte conectada" (`—` nas colunas + pill "Conectar fonte", que é literalmente verdade hoje), e o scoreboard mostra uma mensagem de estado vazio em vez de zeros fingindo cálculo. Nunca inventar valor de negócio (ex.: valor de fatura, contagem de vendas) que não vem de dado real.

**Files:**
- Create: `src/app/dashboard/layout.tsx` (topbar + rail — `Rail` component)
- Create: `src/app/dashboard/page.tsx` ("Visão do grupo")
- Create: `src/app/dashboard/StoreForm.tsx`
- Create: `src/app/dashboard/pessoas/page.tsx` ("Pessoas")
- Create: `src/app/dashboard/pessoas/InviteForm.tsx`

**Interfaces:**
- Consumes: `verifySessionToken`, `SESSION_COOKIE_NAME` (Task 3); `db` (Task 4); `listMembers` (Task 6); `listStores` (Task 8); `POST /api/stores` (Task 11); `POST /api/invites` (Task 10).

- [ ] **Step 1: Write `src/app/dashboard/StoreForm.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function StoreForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ groupId, name, code }),
    });
    if (res.status === 201) {
      setName("");
      setCode("");
      router.refresh();
      return;
    }
    setError("Não foi possível adicionar a loja.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Nome da loja
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </label>
      <label>
        Código
        <input value={code} onChange={(e) => setCode(e.target.value)} required />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Adicionar loja</button>
    </form>
  );
}
```

- [ ] **Step 2: Write `src/app/dashboard/InviteForm.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";

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
      <label>
        E-mail do convidado
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Papel
        <select value={role} onChange={(e) => setRole(e.target.value as "operator" | "support")}>
          <option value="operator">Operador</option>
          <option value="support">Atendimento</option>
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Gerar convite</button>
      {inviteLink && (
        <p>
          Envie este link pra pessoa convidada: <code>{inviteLink}</code>
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Write `src/app/dashboard/page.tsx`**

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { listMembers } from "@/server/services/membershipService";
import { listStores } from "@/server/services/groupService";
import { StoreForm } from "./StoreForm";
import { InviteForm } from "./InviteForm";

export default async function DashboardPage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.userId },
    include: { group: true },
  });
  if (!membership) redirect("/login");

  const [stores, members] = await Promise.all([
    listStores(membership.groupId),
    listMembers(membership.groupId),
  ]);

  const isAdmin = membership.role === "admin";

  return (
    <main>
      <h1>{membership.group.name}</h1>
      <section>
        <h2>Lojas</h2>
        <ul>
          {stores.map((s) => (
            <li key={s.id}>
              {s.name} ({s.code})
            </li>
          ))}
        </ul>
        {isAdmin && <StoreForm groupId={membership.groupId} />}
      </section>
      <section>
        <h2>Membros</h2>
        <ul>
          {members.map((m) => (
            <li key={m.id}>
              {m.email} — {m.role}
            </li>
          ))}
        </ul>
        {isAdmin && <InviteForm groupId={membership.groupId} />}
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, sign up at `/signup`, confirm redirect to `/dashboard`, add a store, generate an invite, open the invite link in a private window, accept it, confirm the new member shows up in the members list after refreshing `/dashboard`.
Expected: all steps succeed with no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard
git commit -m "feat: add dashboard with store and invite management"
```

---

### Task 16: End-to-end verification

**Files:**
- None (verification only).

> **Nota (2026-09-12):** o passo a passo original abaixo ficou desatualizado (signup virou 2 etapas incluindo a 1ª loja, dashboard virou 2 telas com rail lateral, restrição de loja por membro foi adicionada). Executado com o fluxo real — ver checklist atualizado.

- [x] **Step 1: Run the full test suite**

Run: `npx vitest run`
Resultado: `Test Files  15 passed (15)`, `Tests  64 passed (64)`. `tsc --noEmit` limpo.

- [x] **Step 2: Run the manual walkthrough**

Com Postgres e `npm run dev` rodando, fluxo completo executado (via requisições HTTP diretas, equivalentes ao que o navegador faria):
1. `/` sem sessão → redireciona pra `/login`. ✅
2. Signup em 2 etapas: cria "Franquia Teste Final" (admin) e "Loja 1" na mesma sequência. ✅
3. `/` com sessão → redireciona pra `/dashboard`. ✅
4. `/dashboard` mostra "Loja 1", banner de período de teste, nome do grupo. ✅
5. Admin adiciona "Loja 2" pelo form. ✅
6. Gera convite pro operador; `/join/[id]` mostra o form de criar senha com o nome do grupo certo. ✅
7. Convite aceito (senha criada), redireciona com sessão nova. ✅
8. `/dashboard/pessoas` do admin já lista o novo operador. ✅
9. Antes de restringir, operador vê as 2 lojas via `GET /api/stores`. ✅
10. Admin restringe o operador só à Loja 1 (`PUT /api/memberships/[id]/stores`) — rejeita loja de outro grupo com 400, confirmando a validação. ✅
11. Depois de restringir, operador só vê Loja 1. ✅
12. Logout do operador; `/dashboard` sem sessão → redireciona pra `/login`. ✅

Nenhum erro não tratado no console do servidor.

- [x] **Step 3: Commit the plan checklist as done**

---

## Considerações futuras (fora do escopo deste plano)

### Restringir operador/atendimento a um subconjunto de lojas — ✅ implementado (2026-09-12)

Levantado e originalmente registrado aqui como ideia futura; acabou sendo implementado ainda dentro deste plano, antes da Task 16. Resumo do que existe:

- **Schema**: `MembershipStore` (join `membershipId` + `storeId`, `onDelete: Cascade`, `@@unique([membershipId, storeId])`) em `prisma/schema.prisma`.
- **Semântica** (default-allow, opt-in pra restringir): sem nenhuma linha = sem restrição (comportamento padrão, preservado pra todo membership pré-existente); com uma ou mais linhas = só enxerga aquelas lojas; `admin` nunca é restringido.
- **Leitura**: `getAccessibleStoreIds(userId, groupId)` em `membershipService.ts`; `listStores(groupId, accessibleStoreIds?)` filtra no banco quando não é `"all"`. Plugado em `GET /api/stores`, no rail (`dashboard/layout.tsx`) e na tabela de "Todas as lojas" (`dashboard/page.tsx`).
- **Gestão**: `getStoreAssignmentIds` / `setStoreAssignments` em `membershipService.ts`; `PUT /api/memberships/[id]/stores` (admin-only, valida que as lojas pertencem ao grupo do membership); UI (`StoreAssignmentControl`) na tela de Pessoas (`dashboard/pessoas/`).

Ainda fora de escopo (não pedido, não construído): hierarquia de gerentes regionais pra franquias muito grandes — o padrão atual (lista fixa de lojas por membership) resolve o caso de uso real que motivou isso; uma estrutura de "regiões" seria um passo além, só se/quando fizer sentido pro tamanho de cliente do produto.
