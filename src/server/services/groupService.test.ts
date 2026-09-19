import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "../../../tests/helpers/resetDb";
import { signup } from "./authService";
import { createStore, listStores, deactivateStore, activateStore } from "./groupService";

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
    expect(store).toEqual({
      id: expect.any(String),
      name: "Loja Centro",
      code: "CTR",
      city: "Belém, PA",
      active: true,
    });

    const stores = await listStores(groupId);
    expect(stores).toEqual([
      { id: store.id, name: "Loja Centro", code: "CTR", city: "Belém, PA", active: true },
    ]);
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

  it("excludes deactivated stores from listStores", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const storeA = await createStore(groupId, { name: "Loja A", code: "A1", city: "Belém, PA" });
    await createStore(groupId, { name: "Loja B", code: "B1", city: "Belém, PA" });

    await deactivateStore(groupId, storeA.id);

    const stores = await listStores(groupId);
    expect(stores).toHaveLength(1);
    expect(stores[0].name).toBe("Loja B");
  });

  it("returns false and leaves the store untouched for a store in another group", async () => {
    const groupA = await signup({ email: "a@x.com", password: "supersecret1", groupName: "A" });
    const groupB = await signup({ email: "b@x.com", password: "supersecret1", groupName: "B" });
    const storeB = await createStore(groupB.groupId, { name: "Loja B", code: "B1", city: "São Paulo, SP" });

    const result = await deactivateStore(groupA.groupId, storeB.id);

    expect(result).toBe(false);
    const stores = await listStores(groupB.groupId);
    expect(stores).toHaveLength(1);
  });

  it("returns true when it deactivates a real store in the group", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const store = await createStore(groupId, { name: "Loja Centro", code: "CTR", city: "Belém, PA" });

    expect(await deactivateStore(groupId, store.id)).toBe(true);
  });

  it("includes deactivated stores when includeInactive is true, marked inactive", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const storeA = await createStore(groupId, { name: "Loja A", code: "A1", city: "Belém, PA" });
    await createStore(groupId, { name: "Loja B", code: "B1", city: "Belém, PA" });
    await deactivateStore(groupId, storeA.id);

    const stores = await listStores(groupId, "all", true);
    expect(stores).toHaveLength(2);
    expect(stores.find((s) => s.id === storeA.id)).toMatchObject({ active: false });
    expect(stores.find((s) => s.name === "Loja B")).toMatchObject({ active: true });
  });

  it("reactivates a deactivated store", async () => {
    const { groupId } = await signup({
      email: "admin@franquia.com",
      password: "supersecret1",
      groupName: "Franquia Norte",
    });
    const store = await createStore(groupId, { name: "Loja Centro", code: "CTR", city: "Belém, PA" });
    await deactivateStore(groupId, store.id);

    expect(await activateStore(groupId, store.id)).toBe(true);
    expect(await listStores(groupId)).toEqual([{ ...store, active: true }]);
  });

  it("returns false when activating a store from another group", async () => {
    const groupA = await signup({ email: "a@x.com", password: "supersecret1", groupName: "A" });
    const groupB = await signup({ email: "b@x.com", password: "supersecret1", groupName: "B" });
    const storeB = await createStore(groupB.groupId, { name: "Loja B", code: "B1", city: "São Paulo, SP" });
    await deactivateStore(groupB.groupId, storeB.id);

    expect(await activateStore(groupA.groupId, storeB.id)).toBe(false);
    expect(await listStores(groupB.groupId)).toEqual([]);
  });
});
