import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

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

export type LoginInput = { email: string; password: string };
export type LoginResult = { userId: string; email: string };

export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");

  return { userId: user.id, email: user.email };
}
