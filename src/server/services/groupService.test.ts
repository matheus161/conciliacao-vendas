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

    const store = await createStore(groupId, { name: "Loja Centro", code: "CTR", city: "Belém, PA" });
    expect(store).toEqual({ id: expect.any(String), name: "Loja Centro", code: "CTR", city: "Belém, PA" });

    const stores = await listStores(groupId);
    expect(stores).toEqual([{ id: store.id, name: "Loja Centro", code: "CTR", city: "Belém, PA" }]);
  });

  it("only returns stores for the given group", async () => {
    const groupA = await signup({ email: "a@x.com", password: "supersecret1", groupName: "A" });
    const groupB = await signup({ email: "b@x.com", password: "supersecret1", groupName: "B" });

    await createStore(groupA.groupId, { name: "Loja A", code: "A1", city: "Belém, PA" });
    await createStore(groupB.groupId, { name: "Loja B", code: "B1", city: "São Paulo, SP" });

    const storesA = await listStores(groupA.groupId);
    expect(storesA).toHaveLength(1);
    expect(storesA[0].name).toBe("Loja A");
  });

  it("filters by the given accessible store ids when not 'all'", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const storeA = await createStore(groupId, { name: "Loja A", code: "A1", city: "Belém, PA" });
    await createStore(groupId, { name: "Loja B", code: "B1", city: "Belém, PA" });

    const stores = await listStores(groupId, [storeA.id]);
    expect(stores).toEqual([storeA]);
  });

  it("returns every store in the group when accessible ids is 'all'", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    await createStore(groupId, { name: "Loja A", code: "A1", city: "Belém, PA" });
    await createStore(groupId, { name: "Loja B", code: "B1", city: "Belém, PA" });

    const stores = await listStores(groupId, "all");
    expect(stores).toHaveLength(2);
  });
});
