import { db } from "@/lib/db";

export type StoreSummary = { id: string; name: string; code: string; city: string };

export async function listStores(
  groupId: string,
  accessibleStoreIds: string[] | "all" = "all"
): Promise<StoreSummary[]> {
  const stores = await db.store.findMany({
    where: {
      groupId,
      ...(accessibleStoreIds === "all" ? {} : { id: { in: accessibleStoreIds } }),
    },
    orderBy: { name: "asc" },
  });
  return stores.map((s) => ({ id: s.id, name: s.name, code: s.code, city: s.city }));
}

export type CreateStoreInput = { name: string; code: string; city: string };

export async function createStore(groupId: string, input: CreateStoreInput): Promise<StoreSummary> {
  const store = await db.store.create({
    data: { groupId, name: input.name, code: input.code, city: input.city },
  });
  return { id: store.id, name: store.name, code: store.code, city: store.city };
}
