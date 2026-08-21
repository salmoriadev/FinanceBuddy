import { calculatePosition } from "../src/modules/portfolios/portfolio-calculations";

describe("portfolio calculations", () => {
  it("calculates average price, partial sale and dividends from append-only events", () => {
    const result = calculatePosition([
      {
        id: "buy-1",
        type: "buy",
        quantity: "10",
        unitPrice: "10",
        totalAmount: "100",
        occurredAt: new Date("2026-01-01"),
      },
      {
        id: "buy-2",
        type: "buy",
        quantity: "10",
        unitPrice: "20",
        totalAmount: "200",
        occurredAt: new Date("2026-01-02"),
      },
      {
        id: "sell-1",
        type: "sell",
        quantity: "5",
        unitPrice: "30",
        totalAmount: "149",
        fees: "1",
        occurredAt: new Date("2026-01-03"),
      },
      {
        id: "dividend-1",
        type: "dividend",
        totalAmount: "12.50",
        occurredAt: new Date("2026-01-04"),
      },
    ]);

    expect(result.quantity.toString()).toBe("15");
    expect(result.costBasis.toString()).toBe("225");
    expect(result.averagePrice.toString()).toBe("15");
    expect(result.realizedGain.toString()).toBe("74");
    expect(result.dividends.toString()).toBe("12.5");
    expect(result.eventCount).toBe(4);
  });

  it("preserves effective cash for rows written with the former gross total contract", () => {
    const result = calculatePosition([
      {
        id: "legacy-buy",
        type: "buy",
        quantity: "10",
        unitPrice: "15",
        grossAmount: "150",
        totalAmount: "150",
        fees: "2",
        taxes: "3",
        occurredAt: new Date("2026-01-01"),
      },
      {
        id: "legacy-sell",
        type: "sell",
        quantity: "5",
        unitPrice: "30",
        grossAmount: "150",
        totalAmount: "150",
        fees: "1",
        taxes: "2",
        occurredAt: new Date("2026-01-02"),
      },
    ]);

    expect(result.quantity.toString()).toBe("5");
    expect(result.costBasis.toString()).toBe("77.5");
    expect(result.averagePrice.toString()).toBe("15.5");
    expect(result.realizedGain.toString()).toBe("69.5");
  });

  it("preserves a legacy explicit total that differs from quantity times price", () => {
    const result = calculatePosition([
      {
        id: "legacy-explicit-buy",
        type: "buy",
        quantity: "10",
        unitPrice: "15",
        grossAmount: "150",
        totalAmount: "151",
        fees: "2",
        taxes: "3",
        occurredAt: new Date("2026-01-01"),
      },
      {
        id: "legacy-explicit-sell",
        type: "sell",
        quantity: "5",
        unitPrice: "30",
        grossAmount: "150",
        totalAmount: "149",
        fees: "1",
        taxes: "2",
        occurredAt: new Date("2026-01-02"),
      },
    ]);

    expect(result.quantity.toString()).toBe("5");
    expect(result.costBasis.toString()).toBe("78");
    expect(result.averagePrice.toString()).toBe("15.6");
    expect(result.realizedGain.toString()).toBe("68");
  });

  it("keeps recorded totals authoritative when gross audit data is absent", () => {
    const result = calculatePosition([
      {
        id: "custom-buy",
        type: "buy",
        quantity: "10",
        totalAmount: "155",
        fees: "99",
        taxes: "99",
        occurredAt: new Date("2026-01-01"),
      },
      {
        id: "custom-sell",
        type: "sell",
        quantity: "5",
        totalAmount: "147",
        fees: "99",
        taxes: "99",
        occurredAt: new Date("2026-01-02"),
      },
    ]);

    expect(result.costBasis.toString()).toBe("77.5");
    expect(result.realizedGain.toString()).toBe("69.5");
  });
});
