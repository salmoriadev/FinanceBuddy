import { TtlCache } from "../src/common/cache/ttl-cache";

describe("TtlCache", () => {
  it("evicts the oldest entry when a configured size limit is reached", () => {
    const cache = new TtlCache<string, number>(60_000, 2);

    cache.set("attacker-route-1", 1);
    cache.set("attacker-route-2", 2);
    cache.set("attacker-route-3", 3);

    expect(cache.get("attacker-route-1")).toBeNull();
    expect(cache.get("attacker-route-2")).toBe(2);
    expect(cache.get("attacker-route-3")).toBe(3);
  });

  it("rejects invalid size limits", () => {
    expect(() => new TtlCache<string, number>(60_000, 0)).toThrow(RangeError);
  });

  it("supports an entry-specific TTL", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-21T00:00:00.000Z"));
    const cache = new TtlCache<string, number>(60_000);

    cache.set("short-lived", 1, 1_000);
    jest.advanceTimersByTime(1_001);

    expect(cache.get("short-lived")).toBeNull();
    jest.useRealTimers();
  });
});
