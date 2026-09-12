import { db } from "@/lib/db";

export async function resetDb() {
  await db.pendingMembership.deleteMany();
  await db.membershipStore.deleteMany();
  await db.membership.deleteMany();
  await db.store.deleteMany();
  await db.group.deleteMany();
  await db.user.deleteMany();
}
