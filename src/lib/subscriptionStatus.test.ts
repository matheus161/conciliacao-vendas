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
