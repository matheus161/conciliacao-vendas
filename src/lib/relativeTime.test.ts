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
