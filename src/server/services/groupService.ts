import { db } from "@/lib/db";

export type StoreSummary = { id: string; name: string; code: string; city: string; active: boolean };

export async function listStores(
  groupId: string,
  accessibleStoreIds: string[] | "all" = "all",
  includeInactive = false
): Promise<StoreSummary[]> {
  const stores = await db.store.findMany({
    where: {
      groupId,
      ...(includeInactive ? {} : { active: true }),
      ...(accessibleStoreIds === "all" ? {} : { id: { in: accessibleStoreIds } }),
    },
    orderBy: { name: "asc" },
  });
  return stores.map((s) => ({ id: s.id, name: s.name, code: s.code, city: s.city, active: s.active }));
}

export async function deactivateStore(groupId: string, storeId: string): Promise<boolean> {
  const result = await db.store.updateMany({
    where: { id: storeId, groupId },
    data: { active: false },
  });
  return result.count > 0;
}

export async function activateStore(groupId: string, storeId: string): Promise<boolean> {
  const result = await db.store.updateMany({
    where: { id: storeId, groupId },
    data: { active: true },
  });
  return result.count > 0;
}

export type CreateStoreInput = { name: string; code: string; city: string };

export async function createStore(groupId: string, input: CreateStoreInput): Promise<StoreSummary> {
  const store = await db.store.create({
    data: { groupId, name: input.name, code: input.code, city: input.city },
  });
  return { id: store.id, name: store.name, code: store.code, city: store.city, active: store.active };
}
