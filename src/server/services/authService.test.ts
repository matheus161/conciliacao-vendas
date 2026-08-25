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
